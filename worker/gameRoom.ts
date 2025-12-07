import { DurableObject } from 'cloudflare:workers';
import type { GameState, Question, Player, Answer, ClientMessage, ServerMessage, ClientRole } from '@shared/types';
import { z } from 'zod';
import { wsClientMessageSchema, nicknameSchema, LIMITS } from '@shared/validation';
import {
	QUESTION_TIME_LIMIT_MS,
	CLEANUP_DELAY_MS,
	processAnswersAndUpdateScores,
	buildLobbyMessage,
	buildQuestionMessage,
	buildRevealMessage,
	buildLeaderboardMessage,
	buildGameEndMessage,
} from './game';

/** WebSocket attachment data stored per connection */
interface WebSocketAttachment {
	role: ClientRole;
	playerId?: string;
	authenticated: boolean;
}

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
				this.sendMessage(server, { type: 'connected', role: 'host' });
				await this.sendCurrentStateToHost(server, state);
			} else {
				this.sendMessage(server, { type: 'error', message: 'Game not found' });
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
		try {
			const rawData = JSON.parse(message.toString());
			const parseResult = wsClientMessageSchema.safeParse(rawData);
			if (!parseResult.success) {
				this.sendMessage(ws, { type: 'error', message: z.prettifyError(parseResult.error) });
				return;
			}
			const data = parseResult.data as ClientMessage;
			const attachment = ws.deserializeAttachment() as WebSocketAttachment | null;

			// Handle connection/authentication (only for players now)
			if (data.type === 'connect') {
				// Hosts are pre-authenticated via the host-ws endpoint, so reject connect messages from them
				if (attachment?.role === 'host' && attachment.authenticated) {
					this.sendMessage(ws, { type: 'error', message: 'Host already authenticated' });
					return;
				}
				await this.handlePlayerConnect(ws, data);
				return;
			}

			// All other messages require authentication
			if (!attachment?.authenticated) {
				this.sendMessage(ws, { type: 'error', message: 'Not authenticated. Send connect message first.' });
				return;
			}

			// Route message based on type
			switch (data.type) {
				case 'join':
					await this.handleJoin(ws, attachment, data.nickname);
					break;
				case 'startGame':
					await this.handleStartGame(ws, attachment);
					break;
				case 'submitAnswer':
					await this.handleSubmitAnswer(ws, attachment, data.answerIndex);
					break;
				case 'nextState':
					await this.handleNextState(ws, attachment);
					break;
				default:
					this.sendMessage(ws, { type: 'error', message: 'Unknown message type' });
			}
		} catch (err) {
			console.error('WebSocket message error:', err);
			this.sendMessage(ws, { type: 'error', message: 'Invalid message format' });
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
	 * Alarm handler - triggered for cleanup
	 */
	async alarm(): Promise<void> {
		const sockets = this.ctx.getWebSockets();
		const state = await this.getFullGameState();

		// Only cleanup if no active connections or game has ended
		if (sockets.length === 0 || state?.phase === 'END') {
			console.log(`Cleaning up game room: ${state?.id || 'unknown'}`);
			await this.ctx.storage.deleteAll();
		}
	}

	// ============ WebSocket Message Handlers ============

	/**
	 * Handle player connect message - hosts are pre-authenticated via /websocket/host
	 */
	private async handlePlayerConnect(ws: WebSocket, data: Extract<ClientMessage, { type: 'connect' }>): Promise<void> {
		const state = await this.getFullGameState();
		if (!state) {
			this.sendMessage(ws, { type: 'error', message: 'Game not found' });
			ws.close(4004, 'Game not found');
			return;
		}

		// Only handle player connections - hosts use the pre-authenticated /websocket/host path
		if (data.role === 'host') {
			this.sendMessage(ws, { type: 'error', message: 'Hosts must use the host WebSocket endpoint' });
			ws.close(4003, 'Forbidden');
			return;
		}

		// Player connection
		const playerId = data.playerId;
		const existingPlayer = playerId ? state.players.find((p) => p.id === playerId) : null;

		// If reconnecting with valid playerId
		if (existingPlayer) {
			ws.serializeAttachment({
				role: 'player',
				playerId: playerId,
				authenticated: true,
			} as WebSocketAttachment);

			this.sendMessage(ws, { type: 'connected', role: 'player', playerId });
			await this.sendCurrentStateToPlayer(ws, state, playerId!);
		} else {
			// New player - needs to join
			ws.serializeAttachment({
				role: 'player',
				authenticated: true, // Authenticated but not yet joined
			} as WebSocketAttachment);

			this.sendMessage(ws, { type: 'connected', role: 'player' });

			// If game not in lobby, can't join
			if (state.phase !== 'LOBBY') {
				this.sendMessage(ws, { type: 'error', message: 'Game has already started' });
			}
		}
	}

	private async handleJoin(ws: WebSocket, attachment: WebSocketAttachment, nickname: string): Promise<void> {
		if (attachment.role !== 'player') {
			this.sendMessage(ws, { type: 'error', message: 'Only players can join' });
			return;
		}

		if (attachment.playerId) {
			this.sendMessage(ws, { type: 'error', message: 'Already joined' });
			return;
		}

		// Validate nickname with Zod
		const nicknameResult = nicknameSchema.safeParse(nickname);
		if (!nicknameResult.success) {
			this.sendMessage(ws, { type: 'error', message: z.prettifyError(nicknameResult.error) });
			return;
		}
		const validatedNickname = nicknameResult.data;

		const state = await this.getFullGameState();
		if (!state || state.phase !== 'LOBBY') {
			this.sendMessage(ws, { type: 'error', message: 'Cannot join - game not in lobby' });
			return;
		}

		if (state.players.some((p) => p.name.toLowerCase() === validatedNickname.toLowerCase())) {
			this.sendMessage(ws, { type: 'error', message: 'Nickname already taken' });
			return;
		}

		const playerId = crypto.randomUUID();
		const newPlayer: Player = { id: playerId, name: validatedNickname, score: 0, answered: false };
		state.players.push(newPlayer);
		await this.ctx.storage.put('game_state', state);

		// Update WebSocket attachment with playerId
		ws.serializeAttachment({
			...attachment,
			playerId,
		} as WebSocketAttachment);

		// Send confirmation to the joining player
		this.sendMessage(ws, { type: 'connected', role: 'player', playerId });

		// Broadcast lobby update to all connected clients
		this.broadcastLobbyUpdate(state);
	}

	private async handleStartGame(ws: WebSocket, attachment: WebSocketAttachment): Promise<void> {
		if (attachment.role !== 'host') {
			this.sendMessage(ws, { type: 'error', message: 'Only host can start the game' });
			return;
		}

		const state = await this.getFullGameState();
		if (!state || state.phase !== 'LOBBY') {
			this.sendMessage(ws, { type: 'error', message: 'Game not in lobby phase' });
			return;
		}

		state.phase = 'QUESTION';
		state.questionStartTime = Date.now();
		await this.ctx.storage.put('game_state', state);

		// Broadcast question to all
		this.broadcastQuestionStart(state);
	}

	private async handleSubmitAnswer(ws: WebSocket, attachment: WebSocketAttachment, answerIndex: number): Promise<void> {
		if (attachment.role !== 'player' || !attachment.playerId) {
			this.sendMessage(ws, { type: 'error', message: 'Only players can submit answers' });
			return;
		}

		// Validate answer index
		if (typeof answerIndex !== 'number' || answerIndex < 0 || answerIndex >= LIMITS.OPTIONS_MAX) {
			this.sendMessage(ws, { type: 'error', message: 'Invalid answer index' });
			return;
		}

		const state = await this.getFullGameState();
		if (!state || state.phase !== 'QUESTION') {
			this.sendMessage(ws, { type: 'error', message: 'Not in question phase' });
			return;
		}

		const playerId = attachment.playerId;
		if (state.answers.some((a) => a.playerId === playerId)) {
			this.sendMessage(ws, { type: 'error', message: 'Already answered' });
			return;
		}

		const timeTaken = Date.now() - state.questionStartTime;
		if (timeTaken > QUESTION_TIME_LIMIT_MS) {
			this.sendMessage(ws, { type: 'error', message: 'Time is up' });
			return;
		}

		const answer: Answer = { playerId, answerIndex, time: timeTaken };
		state.answers.push(answer);
		await this.ctx.storage.put('game_state', state);

		// Confirm to player
		this.sendMessage(ws, { type: 'answerReceived', answerIndex });

		// Notify host of answer count
		this.broadcastToRole('host', {
			type: 'playerAnswered',
			playerId,
			answeredCount: state.answers.length,
			totalPlayers: state.players.length,
		});

		// Auto-advance to reveal if all players answered
		if (state.answers.length === state.players.length) {
			await this.advanceToReveal(state);
		}
	}

	private async handleNextState(ws: WebSocket, attachment: WebSocketAttachment): Promise<void> {
		if (attachment.role !== 'host') {
			this.sendMessage(ws, { type: 'error', message: 'Only host can advance state' });
			return;
		}

		const state = await this.getFullGameState();
		if (!state) {
			this.sendMessage(ws, { type: 'error', message: 'Game not found' });
			return;
		}

		switch (state.phase) {
			case 'QUESTION':
				await this.advanceToReveal(state);
				break;
			case 'REVEAL':
				state.phase = 'LEADERBOARD';
				state.players.sort((a, b) => b.score - a.score);
				await this.ctx.storage.put('game_state', state);
				this.broadcastLeaderboard(state);
				break;
			case 'LEADERBOARD':
				if (state.currentQuestionIndex < state.questions.length - 1) {
					state.currentQuestionIndex++;
					state.phase = 'QUESTION';
					state.questionStartTime = Date.now();
					state.answers = [];
					state.players.forEach((p) => (p.answered = false));
					await this.ctx.storage.put('game_state', state);
					this.broadcastQuestionStart(state);
				} else {
					state.phase = 'END';
					await this.ctx.storage.put('game_state', state);
					this.broadcastGameEnd(state);
					// Schedule cleanup after game ends
					await this.ctx.storage.setAlarm(Date.now() + CLEANUP_DELAY_MS);
				}
				break;
			default:
				this.sendMessage(ws, { type: 'error', message: 'Invalid state transition' });
		}
	}

	private async advanceToReveal(state: GameState): Promise<void> {
		processAnswersAndUpdateScores(state);
		state.phase = 'REVEAL';
		await this.ctx.storage.put('game_state', state);

		// Broadcast reveal with appropriate data for each role
		this.broadcastReveal(state);
	}

	// ============ Broadcast Helpers ============

	private sendMessage(ws: WebSocket, message: ServerMessage): void {
		try {
			ws.send(JSON.stringify(message));
		} catch (err) {
			console.error('Failed to send message:', err);
		}
	}

	private broadcastToAll(message: ServerMessage): void {
		const sockets = this.ctx.getWebSockets();
		for (const ws of sockets) {
			const attachment = ws.deserializeAttachment() as WebSocketAttachment | null;
			if (attachment?.authenticated) {
				this.sendMessage(ws, message);
			}
		}
	}

	private broadcastToRole(role: ClientRole, message: ServerMessage): void {
		const sockets = this.ctx.getWebSockets();
		for (const ws of sockets) {
			const attachment = ws.deserializeAttachment() as WebSocketAttachment | null;
			if (attachment?.authenticated && attachment.role === role) {
				this.sendMessage(ws, message);
			}
		}
	}

	private broadcastLobbyUpdate(state: GameState): void {
		this.broadcastToAll(buildLobbyMessage(state));
	}

	private broadcastQuestionStart(state: GameState): void {
		this.broadcastToAll(buildQuestionMessage(state));
	}

	private broadcastReveal(state: GameState): void {
		// Send to host (no player-specific result)
		this.broadcastToRole('host', buildRevealMessage(state));

		// Send to each player with their individual result
		const sockets = this.ctx.getWebSockets();
		for (const ws of sockets) {
			const attachment = ws.deserializeAttachment() as WebSocketAttachment | null;
			if (attachment?.authenticated && attachment.role === 'player' && attachment.playerId) {
				this.sendMessage(ws, buildRevealMessage(state, attachment.playerId));
			}
		}
	}

	private broadcastLeaderboard(state: GameState): void {
		this.broadcastToAll(buildLeaderboardMessage(state));
	}

	private broadcastGameEnd(state: GameState): void {
		this.broadcastToAll(buildGameEndMessage(state));
	}

	private async sendCurrentStateToHost(ws: WebSocket, state: GameState): Promise<void> {
		switch (state.phase) {
			case 'LOBBY':
				this.sendMessage(ws, buildLobbyMessage(state));
				break;
			case 'QUESTION':
				this.sendMessage(ws, buildQuestionMessage(state));
				break;
			case 'REVEAL':
				this.sendMessage(ws, buildRevealMessage(state));
				break;
			case 'LEADERBOARD':
				this.sendMessage(ws, buildLeaderboardMessage(state));
				break;
			case 'END':
				this.sendMessage(ws, buildGameEndMessage(state));
				break;
		}
	}

	private async sendCurrentStateToPlayer(ws: WebSocket, state: GameState, playerId: string): Promise<void> {
		switch (state.phase) {
			case 'LOBBY':
				this.sendMessage(ws, buildLobbyMessage(state));
				break;
			case 'QUESTION': {
				this.sendMessage(ws, buildQuestionMessage(state));
				// Check if player already answered
				const existingAnswer = state.answers.find((a) => a.playerId === playerId);
				if (existingAnswer) {
					this.sendMessage(ws, { type: 'answerReceived', answerIndex: existingAnswer.answerIndex });
				}
				break;
			}
			case 'REVEAL':
				this.sendMessage(ws, buildRevealMessage(state, playerId));
				break;
			case 'LEADERBOARD':
				this.sendMessage(ws, buildLeaderboardMessage(state));
				break;
			case 'END':
				this.sendMessage(ws, buildGameEndMessage(state));
				break;
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
