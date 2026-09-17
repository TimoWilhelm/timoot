import { zValidator } from '@hono/zod-validator';
import { waitUntil, env } from 'cloudflare:workers';
import { Hono } from 'hono';
import { z } from 'zod';

import { imagePromptSchema } from '@shared/validation';

import { userIdHeaderSchema, protectedHeaderSchema, getUserId, verifyTurnstile } from '../lib/validators';
import { aiImageMetadataSchema, generateAndStoreBackgroundImage } from '../services/image-generation';

import type { AIImageMetadata } from '../services/image-generation';
import type { ApiResponse } from '@shared/types';

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
export const imageRoutes = new Hono<{ Bindings: never }>()
	// AI Image Generation endpoint (requires turnstile - expensive operation)
	.post(
		'/api/images/generate',
		zValidator('header', protectedHeaderSchema),
		verifyTurnstile,
		zValidator('json', z.object({ prompt: imagePromptSchema })),
		async (c) => {
			try {
				const { prompt } = c.req.valid('json');
				const kvUserId = getUserId(c);
				const generatedImage = await generateAndStoreBackgroundImage(prompt, kvUserId);

				return c.json({
					success: true,
					data: generatedImage,
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
			const kvResult = await env.KV_IMAGES.getWithMetadata<AIImageMetadata>(kvKey, { type: 'arrayBuffer' });

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
				const listResult = await env.KV_IMAGES.list({
					prefix: `user:${kvUserId}:image:`,
					limit: 10,
					cursor: cursor || undefined,
				});

				const images: AIImageListItem[] = listResult.keys.map((key: { name: string; metadata?: unknown }) => {
					const metadataResult = aiImageMetadataSchema.safeParse(key.metadata);
					const metadata = metadataResult.success ? metadataResult.data : undefined;
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
			const existing = await env.KV_IMAGES.get(`user:${kvUserId}:image:${imageId}`);
			if (!existing) {
				return c.json({ success: false, error: 'Image not found' } satisfies ApiResponse, 404);
			}

			await env.KV_IMAGES.delete(`user:${kvUserId}:image:${imageId}`);

			return c.json({ success: true, data: { id: imageId } } satisfies ApiResponse<{ id: string }>);
		} catch (error) {
			console.error('[Image Delete Error]', error);
			return c.json({ success: false, error: 'Failed to delete image' } satisfies ApiResponse, 500);
		}
	});
