import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { PREDEFINED_QUIZZES, GENERAL_KNOWLEDGE_QUIZ } from './quizzes';
import type { ApiResponse, GameState, Quiz } from '@shared/types';
import { generateQuizFromPrompt, generateSingleQuestion, type GenerationStatus, type GeneratedQuestion } from './ai';
import { z } from 'zod';
import { aiGenerateRequestSchema, quizSchema, createGameRequestSchema, imagePromptSchema } from '@shared/validation';
import { exports, waitUntil } from 'cloudflare:workers';
import { oneLine } from 'common-tags';
import { generateGameId } from './words';

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

export function userRoutes(app: Hono<{ Bindings: Env }>) {
	// WebSocket upgrade endpoint - forwards to GameRoom Durable Object
	app.get('/api/games/:gameId/ws', async (c) => {
		const { gameId } = c.req.param();
		const upgradeHeader = c.req.header('Upgrade');
		if (!upgradeHeader || upgradeHeader !== 'websocket') {
			return c.text('Expected WebSocket upgrade', 426);
		}

		// Get the GameRoom DO instance by game ID
		const gameRoomStub = exports.GameRoomDurableObject.getByName(gameId);

		// Forward the WebSocket upgrade request to the Durable Object
		const url = new URL(c.req.url);
		url.pathname = '/websocket';

		return gameRoomStub.fetch(
			new Request(url.toString(), {
				headers: c.req.raw.headers,
			}),
		);
	});
	app.get('/api/quizzes', (c) => {
		return c.json({ success: true, data: PREDEFINED_QUIZZES } satisfies ApiResponse<Quiz[]>);
	});
	app.get('/api/quizzes/custom', async (c) => {
		const quizStoreStub = exports.QuizStoreDurableObject.getByName('global');
		const data = await quizStoreStub.getCustomQuizzes();
		return c.json({ success: true, data } satisfies ApiResponse<Quiz[]>);
	});
	app.get('/api/quizzes/custom/:id', async (c) => {
		const { id } = c.req.param();
		const quizStoreStub = exports.QuizStoreDurableObject.getByName('global');
		const data = await quizStoreStub.getCustomQuizById(id);
		if (!data) {
			return c.json({ success: false, error: 'Quiz not found' }, 404);
		}
		return c.json({ success: true, data } satisfies ApiResponse<Quiz>);
	});
	app.post('/api/quizzes/custom', async (c) => {
		const body = await c.req.json();
		const result = quizSchema.safeParse(body);
		if (!result.success) {
			return c.json({ success: false, error: z.prettifyError(result.error) } satisfies ApiResponse, 400);
		}
		const quizStoreStub = exports.QuizStoreDurableObject.getByName('global');
		const data = await quizStoreStub.saveCustomQuiz(result.data);
		return c.json({ success: true, data }, 201);
	});
	app.put('/api/quizzes/custom/:id', async (c) => {
		const { id } = c.req.param();
		const body = await c.req.json();
		const result = quizSchema.safeParse(body);
		if (!result.success) {
			return c.json({ success: false, error: z.prettifyError(result.error) } satisfies ApiResponse, 400);
		}
		if (id !== result.data.id) {
			return c.json({ success: false, error: 'ID mismatch' }, 400);
		}
		const quizStoreStub = exports.QuizStoreDurableObject.getByName('global');
		const data = await quizStoreStub.saveCustomQuiz(result.data);
		return c.json({ success: true, data });
	});
	app.delete('/api/quizzes/custom/:id', async (c) => {
		const { id } = c.req.param();
		const quizStoreStub = exports.QuizStoreDurableObject.getByName('global');
		const data = await quizStoreStub.deleteCustomQuiz(id);
		if (!data.success) {
			return c.json({ success: false, error: 'Quiz not found' }, 404);
		}
		return c.json({ success: true });
	});
	// AI Quiz Generation endpoint with SSE streaming for status updates
	app.post('/api/quizzes/generate', async (c) => {
		const body = await c.req.json();
		const result = aiGenerateRequestSchema.safeParse(body);
		if (!result.success) {
			return c.json({ success: false, error: z.prettifyError(result.error) } satisfies ApiResponse, 400);
		}
		const { prompt, numQuestions } = result.data;

		return streamSSE(c, async (stream) => {
			try {
				const onStatusUpdate = (status: GenerationStatus) => {
					stream.writeSSE({ event: 'status', data: JSON.stringify(status) });
				};

				const generatedQuiz = await generateQuizFromPrompt(prompt, numQuestions, c.req.raw.signal, onStatusUpdate);

				// Save the generated quiz as a custom quiz
				const quizStoreStub = exports.QuizStoreDurableObject.getByName('global');
				const savedQuiz = await quizStoreStub.saveCustomQuiz({
					title: generatedQuiz.title,
					questions: generatedQuiz.questions,
				});

				await stream.writeSSE({
					event: 'complete',
					data: JSON.stringify({ success: true, data: savedQuiz } satisfies ApiResponse<Quiz>),
				});
			} catch (error) {
				console.error('[AI Quiz Generation Error]', error);
				await stream.writeSSE({
					event: 'error',
					data: JSON.stringify({
						success: false,
						error: error instanceof Error ? error.message : 'Failed to generate quiz',
					} satisfies ApiResponse),
				});
			}
		});
	});
	// AI Single Question Generation endpoint
	app.post('/api/quizzes/generate-question', async (c) => {
		const body = await c.req.json();
		const schema = z.object({
			title: z.string().min(1, 'Quiz title is required'),
			existingQuestions: z
				.array(
					z.object({
						text: z.string(),
						options: z.array(z.string()),
						correctAnswerIndex: z.number(),
					}),
				)
				.optional()
				.default([]),
		});

		const result = schema.safeParse(body);
		if (!result.success) {
			return c.json({ success: false, error: z.prettifyError(result.error) } satisfies ApiResponse, 400);
		}

		try {
			const { title, existingQuestions } = result.data;
			const question = await generateSingleQuestion(title, existingQuestions, c.req.raw.signal);
			return c.json({ success: true, data: question } satisfies ApiResponse<GeneratedQuestion>);
		} catch (error) {
			console.error('[AI Question Generation Error]', error);
			return c.json(
				{
					success: false,
					error: error instanceof Error ? error.message : 'Failed to generate question',
				} satisfies ApiResponse,
				500,
			);
		}
	});
	app.post('/api/games', async (c) => {
		const body = await c.req.json();
		const result = createGameRequestSchema.safeParse(body);
		if (!result.success) {
			return c.json({ success: false, error: z.prettifyError(result.error) } satisfies ApiResponse, 400);
		}

		// Resolve questions from quiz ID
		let questions = GENERAL_KNOWLEDGE_QUIZ;
		if (result.data.quizId) {
			const quizStoreStub = exports.QuizStoreDurableObject.getByName('global');
			const customQuiz = await quizStoreStub.getCustomQuizById(result.data.quizId);
			if (customQuiz) {
				questions = customQuiz.questions;
			} else {
				const predefinedQuiz = PREDEFINED_QUIZZES.find((q) => q.id === result.data.quizId);
				if (predefinedQuiz) {
					questions = predefinedQuiz.questions;
				}
			}
		}

		// Generate a unique game ID for the room (adjective-color-animal format)
		const gameId = generateGameId();
		const gameRoomStub = exports.GameRoomDurableObject.getByName(gameId);

		// Create game with the resolved questions (copied into game state)
		const data = await gameRoomStub.createGame(gameId, questions);
		if ('error' in data) {
			return c.json({ success: false, error: data.error }, 400);
		}

		return c.json({ success: true, data } satisfies ApiResponse<GameState>);
	});

	// AI Image Generation endpoint
	app.post('/api/images/generate', async (c) => {
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
				Style: Fun, suitable for text overlay, no text or letters.
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
			const imagePath = `/api/images/${imageId}`;

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

			await c.env.KV_IMAGES.put(`image:${imageId}`, bytes, {
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
	app.get('/api/images/:imageId', async (c) => {
		const { imageId } = c.req.param();
		const cacheKey = new Request(c.req.url, { method: 'GET' });
		const cache: Cache = caches.default;

		try {
			// Check cache first
			const cachedResponse = await cache.match(cacheKey);
			if (cachedResponse) {
				return cachedResponse;
			}

			// Cache miss - fetch from KV
			const imageData = await c.env.KV_IMAGES.get(`image:${imageId}`, { type: 'arrayBuffer' });

			if (!imageData) {
				return c.json({ success: false, error: 'Image not found' }, 404);
			}

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
			const cursor = c.req.query('cursor');
			const listResult = await c.env.KV_IMAGES.list({
				prefix: 'image:',
				limit: 10,
				cursor: cursor || undefined,
			});

			const images: AIImageListItem[] = listResult.keys.map((key: { name: string; metadata?: unknown }) => {
				const metadata = key.metadata as AIImageMetadata | undefined;
				const id = metadata?.id || key.name.replace('image:', '');
				return {
					id,
					name: metadata?.name || 'AI Generated',
					path: `/api/images/${id}`,
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
	app.delete('/api/images/:imageId', async (c) => {
		const { imageId } = c.req.param();

		try {
			// Check if image exists
			const existing = await c.env.KV_IMAGES.get(`image:${imageId}`);
			if (!existing) {
				return c.json({ success: false, error: 'Image not found' } satisfies ApiResponse, 404);
			}

			await c.env.KV_IMAGES.delete(`image:${imageId}`);

			return c.json({ success: true, data: { id: imageId } } satisfies ApiResponse<{ id: string }>);
		} catch (error) {
			console.error('[Image Delete Error]', error);
			return c.json({ success: false, error: 'Failed to delete image' } satisfies ApiResponse, 500);
		}
	});
}
