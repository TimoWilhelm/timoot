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

// Sync code types
interface SyncCodeData {
	userId: string;
	createdAt: string;
}

// Generate a short 6-character alphanumeric code (uppercase for readability)
function generateSyncCode(): string {
	const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous: 0, O, I, 1
	let code = '';
	for (let i = 0; i < 6; i++) {
		code += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return code;
}

// Helper to extract and validate user ID from request
function getUserIdFromRequest(c: { req: { header: (name: string) => string | undefined } }): string {
	const userId = c.req.header('X-User-Id');
	if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
		// Return a default/fallback for invalid IDs (will create isolated storage)
		return 'anonymous';
	}
	return userId;
}

export function userRoutes(app: Hono<{ Bindings: Env }>) {
	// Host WebSocket upgrade endpoint - requires token validation BEFORE connection
	app.get('/api/games/:gameId/host-ws', async (c) => {
		const { gameId } = c.req.param();
		const token = c.req.query('token');
		const upgradeHeader = c.req.header('Upgrade');

		if (!upgradeHeader || upgradeHeader !== 'websocket') {
			return c.text('Expected WebSocket upgrade', 426);
		}

		if (!token) {
			return c.text('Token required', 401);
		}

		// Get the GameRoom DO instance and validate the token
		const gameRoomStub = exports.GameRoomDurableObject.getByName(gameId);
		const isValid = await gameRoomStub.validateHostSecret(token);

		if (!isValid) {
			return c.text('Invalid host token', 403);
		}

		// Token is valid - forward to DO with host path
		const url = new URL(c.req.url);
		url.pathname = '/websocket/host';

		return gameRoomStub.fetch(
			new Request(url.toString(), {
				headers: c.req.raw.headers,
			}),
		);
	});

	// Player WebSocket upgrade endpoint - no token required
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
		url.pathname = '/websocket/player';

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
		const userId = getUserIdFromRequest(c);
		const quizStoreStub = exports.QuizStoreDurableObject.getByName(`user:${userId}`);
		const data = await quizStoreStub.getCustomQuizzes();
		// Update last activity (non-blocking)
		waitUntil(quizStoreStub.touchLastAccess(userId));
		return c.json({ success: true, data } satisfies ApiResponse<Quiz[]>);
	});
	app.get('/api/quizzes/custom/:id', async (c) => {
		const { id } = c.req.param();
		const userId = getUserIdFromRequest(c);
		const quizStoreStub = exports.QuizStoreDurableObject.getByName(`user:${userId}`);
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
		const userId = getUserIdFromRequest(c);
		const quizStoreStub = exports.QuizStoreDurableObject.getByName(`user:${userId}`);
		const data = await quizStoreStub.saveCustomQuiz(result.data);
		// Update last activity (non-blocking)
		waitUntil(quizStoreStub.touchLastAccess(userId));
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
		const userId = getUserIdFromRequest(c);
		const quizStoreStub = exports.QuizStoreDurableObject.getByName(`user:${userId}`);
		const data = await quizStoreStub.saveCustomQuiz(result.data);
		// Update last activity (non-blocking)
		waitUntil(quizStoreStub.touchLastAccess(userId));
		return c.json({ success: true, data });
	});
	app.delete('/api/quizzes/custom/:id', async (c) => {
		const { id } = c.req.param();
		const userId = getUserIdFromRequest(c);
		const quizStoreStub = exports.QuizStoreDurableObject.getByName(`user:${userId}`);
		const data = await quizStoreStub.deleteCustomQuiz(id);
		if (!data.success) {
			return c.json({ success: false, error: 'Quiz not found' }, 404);
		}
		// Update last activity (non-blocking)
		waitUntil(quizStoreStub.touchLastAccess(userId));
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

				const generatedQuiz = await generateQuizFromPrompt(prompt, numQuestions, c.req.raw.signal, onStatusUpdate, {
					connecting_ip: c.req.header('CF-Connecting-IP') ?? 'unknown',
				});

				// Save the generated quiz as a custom quiz
				const userId = getUserIdFromRequest(c);
				const quizStoreStub = exports.QuizStoreDurableObject.getByName(`user:${userId}`);
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
			const question = await generateSingleQuestion(title, existingQuestions, c.req.raw.signal, {
				connecting_ip: c.req.header('CF-Connecting-IP') ?? 'unknown',
			});
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
	// Check if a game exists
	app.get('/api/games/:gameId/exists', async (c) => {
		const { gameId } = c.req.param();
		const gameRoomStub = exports.GameRoomDurableObject.getByName(gameId);
		const state = await gameRoomStub.getFullGameState();

		if (!state) {
			return c.json({ success: false, error: 'Game not found' } satisfies ApiResponse, 404);
		}

		return c.json({ success: true, data: { exists: true, phase: state.phase } } satisfies ApiResponse<{ exists: boolean; phase: string }>);
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
			const userId = getUserIdFromRequest(c);
			const quizStoreStub = exports.QuizStoreDurableObject.getByName(`user:${userId}`);
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

	// ============ Sync Code Endpoints ============

	// Generate a sync code for the current user
	app.post('/api/sync/generate', async (c) => {
		const userId = getUserIdFromRequest(c);
		if (userId === 'anonymous') {
			return c.json({ success: false, error: 'Valid user ID required' } satisfies ApiResponse, 400);
		}

		try {
			// Generate a unique sync code (retry if collision)
			let code: string;
			let attempts = 0;
			do {
				code = generateSyncCode();
				const existing = await c.env.KV_SYNC.get(`sync:${code}`);
				if (!existing) break;
				attempts++;
			} while (attempts < 5);

			if (attempts >= 5) {
				return c.json({ success: false, error: 'Failed to generate unique code' } satisfies ApiResponse, 500);
			}

			const syncData: SyncCodeData = {
				userId,
				createdAt: new Date().toISOString(),
			};

			// Store with 15 minute expiration
			await c.env.KV_SYNC.put(`sync:${code}`, JSON.stringify(syncData), {
				expirationTtl: 15 * 60, // 15 minutes
			});

			return c.json({
				success: true,
				data: { code, expiresIn: 15 * 60 },
			} satisfies ApiResponse<{ code: string; expiresIn: number }>);
		} catch (error) {
			console.error('[Sync Code Generation Error]', error);
			return c.json({ success: false, error: 'Failed to generate sync code' } satisfies ApiResponse, 500);
		}
	});

	// Redeem a sync code to get the associated userId
	app.post('/api/sync/redeem', async (c) => {
		const schema = z.object({
			code: z.string().length(6).toUpperCase(),
		});

		const body = await c.req.json();
		const result = schema.safeParse(body);
		if (!result.success) {
			return c.json({ success: false, error: 'Invalid sync code format' } satisfies ApiResponse, 400);
		}

		const { code } = result.data;

		try {
			const syncDataStr = await c.env.KV_SYNC.get(`sync:${code}`);
			if (!syncDataStr) {
				return c.json({ success: false, error: 'Sync code not found or expired' } satisfies ApiResponse, 404);
			}

			const syncData = JSON.parse(syncDataStr) as SyncCodeData;

			// Delete the code after use (one-time use)
			await c.env.KV_SYNC.delete(`sync:${code}`);

			return c.json({
				success: true,
				data: { userId: syncData.userId },
			} satisfies ApiResponse<{ userId: string }>);
		} catch (error) {
			console.error('[Sync Code Redemption Error]', error);
			return c.json({ success: false, error: 'Failed to redeem sync code' } satisfies ApiResponse, 500);
		}
	});
}
