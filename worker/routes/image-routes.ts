import { Hono } from 'hono';
import { z } from 'zod';
import { waitUntil } from 'cloudflare:workers';
import { oneLine } from 'common-tags';
import { getUserIdFromRequest } from './utils';
import { getTurnstileToken, validateTurnstile } from './turnstile';
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
 * Register image-related routes
 */
export function registerImageRoutes(app: Hono<{ Bindings: Env }>) {
	// AI Image Generation endpoint
	app.post('/api/images/generate', async (c) => {
		const turnstileResponse = await validateTurnstile(c, getTurnstileToken(c));
		if (turnstileResponse) return turnstileResponse;

		const schema = z.object({
			prompt: imagePromptSchema,
		});

		const body = await c.req.json();
		const result = schema.safeParse(body);
		if (!result.success) {
			return c.json({ success: false, error: z.prettifyError(result.error) } satisfies ApiResponse, 400);
		}

		try {
			const { prompt } = result.data;

			// Augment prompt for quiz card background suitability
			const augmentedPrompt = oneLine`
				A beautiful, vibrant background image for a quiz card.
				Style: Fun, suitable for text overlay.
				NEVER include text or letters in the image.
				Theme: ${prompt}.
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
			const kvUserId = getUserIdFromRequest(c);
			const imagePath = `/api/images/${kvUserId}/${imageId}`;

			// Decode base64 to binary
			const binaryString = atob(image);
			const bytes = new Uint8Array(binaryString.length);
			for (let i = 0; i < binaryString.length; i++) {
				bytes[i] = binaryString.charCodeAt(i);
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
	});

	// Get AI-generated image by ID (serve from cache or KV)
	app.get('/api/images/:userId/:imageId', async (c) => {
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
				},
			});

			// Store in cache asynchronously (response must be cloned since body can only be read once)
			waitUntil(cache.put(cacheKey, response.clone()));

			return response;
		} catch (error) {
			console.error('[Image Fetch Error]', error);
			return c.json({ success: false, error: 'Failed to fetch image' }, 500);
		}
	});

	// List all AI-generated images with pagination
	app.get('/api/images', async (c) => {
		try {
			const kvUserId = getUserIdFromRequest(c);
			const cursor = c.req.query('cursor');
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
	});

	// Delete AI-generated image by ID
	app.delete('/api/images/:userId/:imageId', async (c) => {
		const turnstileResponse = await validateTurnstile(c, getTurnstileToken(c));
		if (turnstileResponse) return turnstileResponse;

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
}
