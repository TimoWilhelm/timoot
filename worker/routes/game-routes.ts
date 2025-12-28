import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { exports } from 'cloudflare:workers';
import { GENERAL_KNOWLEDGE_QUIZ, PREDEFINED_QUIZZES } from '../quizzes';
import { generateGameId } from '../words';
import { checkRateLimit } from './utilities';
import { protectedHeaderSchema, getUserId, verifyTurnstile } from './validators';
import { createGameRequestSchema } from '@shared/validation';
import type { ApiResponse, GameState } from '@shared/types';

/**
 * Game routes with RPC-compatible chained methods.
 * Note: WebSocket endpoints don't work with hc client, use fetch directly.
 */
export const gameRoutes = new Hono<{ Bindings: Env }>()
	// Host WebSocket upgrade endpoint - requires token validation BEFORE connection
	.get('/api/games/:gameId/host-ws', async (c) => {
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
	})

	// Player WebSocket upgrade endpoint - no token required
	.get('/api/games/:gameId/ws', async (c) => {
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
	})

	// Check if a game exists
	.get('/api/games/:gameId/exists', async (c) => {
		const { gameId } = c.req.param();
		const gameRoomStub = exports.GameRoomDurableObject.getByName(gameId);
		const state = await gameRoomStub.getFullGameState();

		if (!state) {
			return c.json({ success: false, error: 'Game not found' } satisfies ApiResponse, 404);
		}

		return c.json({ success: true, data: { exists: true, phase: state.phase } } satisfies ApiResponse<{ exists: boolean; phase: string }>);
	})

	// Create a new game (requires turnstile - expensive operation)
	.post(
		'/api/games',
		zValidator('header', protectedHeaderSchema),
		verifyTurnstile,
		zValidator('json', createGameRequestSchema),
		async (c) => {
			// Rate limit game creation
			const rateLimitResponse = await checkRateLimit(c, c.env.GAME_RATE_LIMITER, 'game-create');
			if (rateLimitResponse) return rateLimitResponse;

			const { quizId } = c.req.valid('json');

			// Resolve questions from quiz ID
			let questions = GENERAL_KNOWLEDGE_QUIZ;
			if (quizId) {
				const userId = getUserId(c);
				const quizStoreStub = exports.UserStoreDurableObject.getByName(`user:${userId}`);
				const customQuiz = await quizStoreStub.getCustomQuizById(quizId);
				if (customQuiz) {
					questions = customQuiz.questions;
				} else {
					const predefinedQuiz = PREDEFINED_QUIZZES.find((q) => q.id === quizId);
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
		},
	);
