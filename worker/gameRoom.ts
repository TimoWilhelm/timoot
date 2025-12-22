import { DurableObject } from 'cloudflare:workers';
import type { GameState, Question, ClientMessage } from '@shared/types';
import { z } from 'zod';
import { wsClientMessageSchema } from '@shared/validation';
import { ErrorCode, createError } from '@shared/errors';
import { CLEANUP_DELAY_MS, QUESTION_MODIFIER_DURATION_MS, END_REVEAL_DELAY_MS, questionHasModifiers } from './game';
import {
	type WebSocketAttachment,
	type HandlerContext,
	sendMessage,
	broadcastQuestionModifier,
	broadcastQuestionStart,
	broadcastGameEnd,
	handlePlayerConnect,
	handleJoin,
	handleStartGame,
	handleSubmitAnswer,
	handleSendEmoji,
	handleNextState,
	advanceToReveal,
} from './gameRoom/index';
import { sendCurrentStateToHost } from './gameRoom/stateSync';

/**
 * GameRoomDurableObject - One instance per game room
 * Accessed via idFromName(gameId) where gameId is the unique game identifier
 *
 * Stores the complete game data (including questions) so the game can complete
 * even if the source quiz is deleted.
 *
 * Cleanup occurs:
 * - After the game ends (END phase)
 * - After all WebSocket connections are closed for CLEANUP_DELAY_MS
 */
export class GameRoomDurableObject extends DurableObject<Env> {
	// ============ Context Helper ============

	/**
	 * Creates a handler context for use with extracted handler functions.
	 */
	private getHandlerContext(): HandlerContext {
		return {
			getWebSockets: () => this.ctx.getWebSockets(),
			env: this.env,
			storage: this.ctx.storage,
			setAlarm: (timestamp: number) => this.ctx.storage.setAlarm(timestamp),
		};
	}

	// ============ WebSocket Hibernation API Methods ============

	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);

		// Handle WebSocket upgrade requests - host path (pre-authenticated)
		if (url.pathname === '/websocket/host') {
			const upgradeHeader = request.headers.get('Upgrade');
			if (!upgradeHeader || upgradeHeader !== 'websocket') {
				return new Response('Expected WebSocket upgrade', { status: 426 });
			}

			const webSocketPair = new WebSocketPair();
			const [client, server] = Object.values(webSocketPair);

			// Accept the WebSocket with hibernation support
			this.ctx.acceptWebSocket(server);

			// Host is pre-authenticated via token validation in the route
			server.serializeAttachment({
				role: 'host',
				authenticated: true,
			} as WebSocketAttachment);

			// Cancel any pending cleanup alarm since we have a new connection
			await this.ctx.storage.deleteAlarm();

			// Send connected message and current state immediately
			const state = await this.getFullGameState();
			if (state) {
				sendMessage(server, { type: 'connected', role: 'host' });
				sendCurrentStateToHost(server, state, this.env);
				// Re-schedule alarm if we're in a phase that needs one
				if (state.phase === 'END_INTRO') {
					await this.ctx.storage.setAlarm(Date.now() + END_REVEAL_DELAY_MS);
				}
			} else {
				sendMessage(server, { type: 'error', ...createError(ErrorCode.GAME_NOT_FOUND) });
				server.close(4004, 'Game not found');
			}

			return new Response(null, { status: 101, webSocket: client });
		}

		// Handle WebSocket upgrade requests - player path
		if (url.pathname === '/websocket/player') {
			const upgradeHeader = request.headers.get('Upgrade');
			if (!upgradeHeader || upgradeHeader !== 'websocket') {
				return new Response('Expected WebSocket upgrade', { status: 426 });
			}

			const webSocketPair = new WebSocketPair();
			const [client, server] = Object.values(webSocketPair);

			// Accept the WebSocket with hibernation support
			this.ctx.acceptWebSocket(server);

			// Set initial attachment - not yet authenticated
			server.serializeAttachment({
				role: 'player',
				authenticated: false,
			} as WebSocketAttachment);

			// Cancel any pending cleanup alarm since we have a new connection
			await this.ctx.storage.deleteAlarm();

			return new Response(null, { status: 101, webSocket: client });
		}

		return new Response('Not Found', { status: 404 });
	}

	async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
		const ctx = this.getHandlerContext();
		const getState = () => this.getFullGameState();

		try {
			const rawData = JSON.parse(message.toString());
			const parseResult = wsClientMessageSchema.safeParse(rawData);
			if (!parseResult.success) {
				sendMessage(ws, { type: 'error', ...createError(ErrorCode.VALIDATION_ERROR, z.prettifyError(parseResult.error)) });
				return;
			}
			const data = parseResult.data as ClientMessage;
			const attachment = ws.deserializeAttachment() as WebSocketAttachment | null;

			// Handle connection/authentication (only for players now)
			if (data.type === 'connect') {
				// Hosts are pre-authenticated via the host-ws endpoint, so reject connect messages from them
				if (attachment?.role === 'host' && attachment.authenticated) {
					sendMessage(ws, { type: 'error', ...createError(ErrorCode.HOST_ALREADY_AUTHENTICATED) });
					return;
				}
				await handlePlayerConnect(ctx, ws, data, getState);
				return;
			}

			// All other messages require authentication
			if (!attachment?.authenticated) {
				sendMessage(ws, { type: 'error', ...createError(ErrorCode.NOT_AUTHENTICATED) });
				return;
			}

			// Route message based on type
			switch (data.type) {
				case 'join':
					await handleJoin(ctx, ws, attachment, data.nickname, getState);
					break;
				case 'startGame':
					await handleStartGame(ctx, ws, attachment, getState);
					break;
				case 'submitAnswer':
					await handleSubmitAnswer(ctx, ws, attachment, data.answerIndex, getState);
					break;
				case 'nextState':
					await handleNextState(ctx, ws, attachment, getState);
					break;
				case 'sendEmoji':
					await handleSendEmoji(ctx, ws, attachment, data.emoji, getState);
					break;
				default:
					sendMessage(ws, { type: 'error', ...createError(ErrorCode.UNKNOWN_MESSAGE_TYPE) });
			}
		} catch (err) {
			console.error('WebSocket message error:', err);
			sendMessage(ws, { type: 'error', ...createError(ErrorCode.INVALID_MESSAGE_FORMAT) });
		}
	}

	async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean): Promise<void> {
		console.log(`WebSocket closed: code=${code}, reason=${reason}, wasClean=${wasClean}`);

		// Check if all connections are closed, schedule cleanup
		const sockets = this.ctx.getWebSockets();
		if (sockets.length === 0) {
			// Schedule cleanup alarm
			await this.ctx.storage.setAlarm(Date.now() + CLEANUP_DELAY_MS);
		}
	}

	async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
		console.error('WebSocket error:', error);

		// Check if all connections are closed, schedule cleanup
		const sockets = this.ctx.getWebSockets();
		if (sockets.length === 0) {
			// Schedule cleanup alarm
			await this.ctx.storage.setAlarm(Date.now() + CLEANUP_DELAY_MS);
		}
	}

	/**
	 * Alarm handler - triggered for phase transitions or cleanup
	 */
	async alarm(): Promise<void> {
		const ctx = this.getHandlerContext();
		const sockets = this.ctx.getWebSockets();
		const state = await this.getFullGameState();

		// Handle GET_READY -> QUESTION_MODIFIER or QUESTION transition
		if (state?.phase === 'GET_READY') {
			if (questionHasModifiers(state)) {
				state.phase = 'QUESTION_MODIFIER';
				await this.ctx.storage.put('game_state', state);
				broadcastQuestionModifier(ctx, state);
				// Schedule transition to QUESTION after modifier display
				await this.ctx.storage.setAlarm(Date.now() + QUESTION_MODIFIER_DURATION_MS);
			} else {
				state.phase = 'QUESTION';
				state.questionStartTime = Date.now();
				await this.ctx.storage.put('game_state', state);
				broadcastQuestionStart(ctx, state);
			}
			return;
		}

		// Handle QUESTION_MODIFIER -> QUESTION transition
		if (state?.phase === 'QUESTION_MODIFIER') {
			state.phase = 'QUESTION';
			state.questionStartTime = Date.now();
			await this.ctx.storage.put('game_state', state);
			broadcastQuestionStart(ctx, state);
			return;
		}

		// Handle QUESTION -> REVEAL transition (when all players answered or time expired)
		if (state?.phase === 'QUESTION' && state.answers.length === state.players.length) {
			await advanceToReveal(ctx, state);
			return;
		}

		// Handle END_INTRO -> END_REVEALED transition
		if (state?.phase === 'END_INTRO') {
			state.phase = 'END_REVEALED';
			await this.ctx.storage.put('game_state', state);
			broadcastGameEnd(ctx, state, true);
			return;
		}

		// Only cleanup if no active connections or game has ended
		if (sockets.length === 0 || state?.phase === 'END_REVEALED') {
			console.log(`Cleaning up game room: ${state?.id || 'unknown'}`);
			await this.ctx.storage.deleteAll();
		}
	}

	// ============ Game Management Methods (RPC) ============

	/**
	 * Creates a new game with the provided questions.
	 * The questions are stored directly in the game state so the game can
	 * complete even if the source quiz is deleted.
	 * @param gameId - The unique game ID (adjective-color-animal format)
	 * @param questions - The quiz questions
	 */
	async createGame(gameId: string, questions: Question[]): Promise<GameState | { error: string }> {
		// Check if game already exists
		const existingState = await this.getFullGameState();
		if (existingState) {
			return { error: 'Game already exists in this room' };
		}

		if (questions.length === 0) {
			return { error: 'Cannot start a game with an empty quiz.' };
		}

		const pin = Math.floor(100000 + Math.random() * 900000).toString();

		const newGame: GameState = {
			id: gameId,
			pin,
			phase: 'LOBBY',
			players: [],
			questions: questions, // Store full questions data
			currentQuestionIndex: 0,
			questionStartTime: 0,
			answers: [],
			hostSecret: crypto.randomUUID(),
		};

		await this.ctx.storage.put('game_state', newGame);
		return newGame;
	}

	async getFullGameState(): Promise<GameState | null> {
		const state = await this.ctx.storage.get<GameState>('game_state');
		return state ?? null;
	}

	/**
	 * Validate the host secret - used by the route to authenticate before WebSocket upgrade
	 */
	async validateHostSecret(token: string): Promise<boolean> {
		const state = await this.getFullGameState();
		if (!state || !state.hostSecret) {
			return false;
		}
		return state.hostSecret === token;
	}
}
