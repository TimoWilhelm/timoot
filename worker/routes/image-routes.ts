import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { waitUntil } from 'cloudflare:workers';
import { oneLine } from 'common-tags';
import { userIdHeaderSchema, protectedHeaderSchema, getUserId, verifyTurnstile } from './validators';
import { imagePromptSchema } from '@shared/validation';
import type { ApiResponse } from '@shared/types';

// AI Image types
interface AIImageMetadata {
	id: string;
	name: string;
	prompt: string;
	createdAt: string;
}

interface FluxResponse {
	result: { image: string };
	errors: unknown[];
	messages: unknown[];
}

interface AIImageListItem {
	id: string;
	name: string;
	path: string;
	prompt?: string;
	createdAt?: string;
}

interface AIImageListResponse {
	images: AIImageListItem[];
	nextCursor?: string;
}

/**
 * Image routes with RPC-compatible chained methods.
 */
export const imageRoutes = new Hono<{ Bindings: Env }>()
	// AI Image Generation endpoint (requires turnstile - expensive operation)
	.post(
		'/api/images/generate',
		zValidator('header', protectedHeaderSchema),
		verifyTurnstile,
		zValidator('json', z.object({ prompt: imagePromptSchema })),
		async (c) => {
			try {
				const { prompt } = c.req.valid('json');

				// Augment prompt for background image suitability
				const augmentedPrompt = oneLine`
				${prompt}, pure photographic wallpaper, wide panoramic landscape composition,
				frame composition with richer detail toward edges and fewer busy elements in the center,
				8k resolution, cinematic lighting, vivid sharp details
			`;

				// Generate image using flux-2-dev model
				const form = new FormData();
				form.append('prompt', augmentedPrompt);
				form.append('steps', '15');
				form.append('width', '1024');
				form.append('height', '512');

				const formRequest = new Request('http://dummy', {
					method: 'POST',
					body: form,
				});
				const formStream = formRequest.body;
				const formContentType = formRequest.headers.get('content-type') || 'multipart/form-data';

				// @ts-expect-error model types not available
				const response = await c.env.AI.run('@cf/black-forest-labs/flux-2-dev', {
					multipart: {
						body: formStream,
						contentType: formContentType,
					},
				});

				// Handle different response structures
				const image = (response as FluxResponse).result?.image ?? (response as { image?: string }).image;
				if (!image) {
					throw new Error(`No image returned from AI. Response: ${JSON.stringify(response)}`);
				}

				// Generate unique ID for the image
				const imageId = crypto.randomUUID();
				const kvUserId = getUserId(c);
				const imagePath = `/api/images/${kvUserId}/${imageId}`;

				// Decode base64 to binary
				const binaryString = atob(image);
				const bytes = new Uint8Array(binaryString.length);
				for (let index = 0; index < binaryString.length; index++) {
					bytes[index] = binaryString.codePointAt(index) ?? 0;
				}

				// Store image in KV with metadata
				const metadata: AIImageMetadata = {
					id: imageId,
					name: prompt.slice(0, 50) + (prompt.length > 50 ? '...' : ''),
					prompt,
					createdAt: new Date().toISOString(),
				};

				await c.env.KV_IMAGES.put(`user:${kvUserId}:image:${imageId}`, bytes, {
					metadata,
				});

				return c.json({
					success: true,
					data: { path: imagePath, ...metadata },
				} satisfies ApiResponse<{ path: string } & AIImageMetadata>);
			} catch (error) {
				console.error('[AI Image Generation Error]', error);
				return c.json(
					{
						success: false,
						error: error instanceof Error ? error.message : 'Failed to generate image',
					} satisfies ApiResponse,
					500,
				);
			}
		},
	)

	// Get AI-generated image by ID (serve from cache or KV) - no auth required for serving
	.get('/api/images/:userId/:imageId', async (c) => {
		const { userId: kvUserId, imageId } = c.req.param();
		const cacheKey = new Request(`${c.req.url}?userId=${kvUserId}`, { method: 'GET' });
		const cache: Cache = caches.default;

		try {
			// Check cache first
			const cachedResponse = await cache.match(cacheKey);
			if (cachedResponse) {
				return cachedResponse;
			}

			// Cache miss - fetch from KV (with metadata to refresh TTL)
			const kvKey = `user:${kvUserId}:image:${imageId}`;
			const kvResult = await c.env.KV_IMAGES.getWithMetadata<AIImageMetadata>(kvKey, { type: 'arrayBuffer' });

			if (!kvResult.value) {
				return c.json({ success: false, error: 'Image not found' }, 404);
			}

			const imageData = kvResult.value;

			const response = new Response(imageData, {
				headers: {
					'Content-Type': 'image/jpeg',
					'Cache-Control': 'public, max-age=31536000, immutable',
					Vary: 'Accept-Encoding',
				},
			});

			// Store in cache asynchronously (response must be cloned since body can only be read once)
			waitUntil(cache.put(cacheKey, response.clone()));

			return response;
		} catch (error) {
			console.error('[Image Fetch Error]', error);
			return c.json({ success: false, error: 'Failed to fetch image' }, 500);
		}
	})

	// List all AI-generated images with pagination
	.get(
		'/api/images',
		zValidator('header', userIdHeaderSchema),
		zValidator('query', z.object({ cursor: z.string().optional() })),
		async (c) => {
			try {
				const kvUserId = getUserId(c);
				const cursor = c.req.valid('query').cursor;
				const listResult = await c.env.KV_IMAGES.list({
					prefix: `user:${kvUserId}:image:`,
					limit: 10,
					cursor: cursor || undefined,
				});

				const images: AIImageListItem[] = listResult.keys.map((key: { name: string; metadata?: unknown }) => {
					const metadata = key.metadata as AIImageMetadata | undefined;
					const id = metadata?.id || key.name.replace(/^user:[^:]+:image:/, '');
					return {
						id,
						name: metadata?.name || 'AI Generated',
						path: `/api/images/${kvUserId}/${id}`,
						prompt: metadata?.prompt,
						createdAt: metadata?.createdAt,
					};
				});

				// Sort by createdAt descending (newest first)
				images.sort((a, b) => {
					if (!a.createdAt || !b.createdAt) return 0;
					return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
				});

				const response: AIImageListResponse = {
					images,
					nextCursor: listResult.list_complete ? undefined : listResult.cursor,
				};

				return c.json({ success: true, data: response } satisfies ApiResponse<AIImageListResponse>);
			} catch (error) {
				console.error('[Image List Error]', error);
				return c.json({ success: false, error: 'Failed to list images' }, 500);
			}
		},
	)

	// Delete AI-generated image by ID
	.delete('/api/images/:userId/:imageId', zValidator('header', userIdHeaderSchema), async (c) => {
		const { userId: kvUserId, imageId } = c.req.param();

		try {
			// Check if image exists
			const existing = await c.env.KV_IMAGES.get(`user:${kvUserId}:image:${imageId}`);
			if (!existing) {
				return c.json({ success: false, error: 'Image not found' } satisfies ApiResponse, 404);
			}

			await c.env.KV_IMAGES.delete(`user:${kvUserId}:image:${imageId}`);

			return c.json({ success: true, data: { id: imageId } } satisfies ApiResponse<{ id: string }>);
		} catch (error) {
			console.error('[Image Delete Error]', error);
			return c.json({ success: false, error: 'Failed to delete image' } satisfies ApiResponse, 500);
		}
	});
