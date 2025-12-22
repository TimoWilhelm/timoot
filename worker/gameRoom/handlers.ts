import type { GameState, ClientMessage, Player, Answer, EmojiReaction } from '@shared/types';
import { phaseAllowsEmoji } from '@shared/phaseRules';
import { z } from 'zod';
import { nicknameSchema, LIMITS } from '@shared/validation';
import { ErrorCode, createError } from '@shared/errors';
import {
	QUESTION_TIME_LIMIT_MS,
	ALL_ANSWERED_DELAY_MS,
	QUESTION_MODIFIER_DURATION_MS,
	END_REVEAL_DELAY_MS,
	MAX_PLAYERS,
	processAnswersAndUpdateScores,
	questionHasModifiers,
} from '../game';
import type { WebSocketAttachment } from './types';
import {
	sendMessage,
	broadcastToRole,
	broadcastLobbyUpdate,
	broadcastGetReady,
	broadcastQuestionModifier,
	broadcastQuestionStart,
	broadcastReveal,
	broadcastLeaderboard,
	broadcastGameEnd,
	getReadyCountdownMs,
	type BroadcastContext,
} from './broadcastHelpers';
import { sendCurrentStateToPlayer } from './stateSync';

/**
 * Storage context interface for handler operations.
 */
export interface StorageContext {
	storage: DurableObjectStorage;
	env: Env;
}

/**
 * Full handler context combining broadcast and storage capabilities.
 */
export interface HandlerContext extends BroadcastContext, StorageContext {
	setAlarm: (timestamp: number) => Promise<void>;
}

/**
 * Handle player connect message - hosts are pre-authenticated via /websocket/host
 */
export async function handlePlayerConnect(
	ctx: HandlerContext,
	ws: WebSocket,
	data: Extract<ClientMessage, { type: 'connect' }>,
	getFullGameState: () => Promise<GameState | null>,
): Promise<void> {
	const state = await getFullGameState();
	if (!state) {
		sendMessage(ws, { type: 'error', ...createError(ErrorCode.GAME_NOT_FOUND) });
		ws.close(4004, 'Game not found');
		return;
	}

	// Only handle player connections - hosts use the pre-authenticated /websocket/host path
	if (data.role === 'host') {
		sendMessage(ws, { type: 'error', ...createError(ErrorCode.HOST_ENDPOINT_REQUIRED) });
		ws.close(4003, 'Forbidden');
		return;
	}

	// Player connection
	const playerId = data.playerId;
	const playerToken = data.playerToken;
	const existingPlayer = playerId ? state.players.find((p) => p.id === playerId) : null;

	// If reconnecting with valid playerId, verify the secure token
	if (existingPlayer) {
		// Validate player token for reconnection security
		if (!playerToken || existingPlayer.token !== playerToken) {
			sendMessage(ws, { type: 'error', ...createError(ErrorCode.INVALID_SESSION_TOKEN) });
			ws.close(4003, 'Invalid session token');
			return;
		}

		ws.serializeAttachment({
			role: 'player',
			playerId: playerId,
			authenticated: true,
		} as WebSocketAttachment);

		// Send back the token so client can verify/restore it
		sendMessage(ws, { type: 'connected', role: 'player', playerId, playerToken: existingPlayer.token });
		sendCurrentStateToPlayer(ws, state, playerId!, ctx.env);
	} else {
		// New player - needs to join
		ws.serializeAttachment({
			role: 'player',
			authenticated: true, // Authenticated but not yet joined
		} as WebSocketAttachment);

		sendMessage(ws, { type: 'connected', role: 'player' });

		// If game not in lobby, can't join
		if (state.phase !== 'LOBBY') {
			sendMessage(ws, { type: 'error', ...createError(ErrorCode.GAME_ALREADY_STARTED) });
		}
	}
}

/**
 * Handle player join request.
 */
export async function handleJoin(
	ctx: HandlerContext,
	ws: WebSocket,
	attachment: WebSocketAttachment,
	nickname: string,
	getFullGameState: () => Promise<GameState | null>,
): Promise<void> {
	if (attachment.role !== 'player') {
		sendMessage(ws, { type: 'error', ...createError(ErrorCode.ONLY_PLAYERS_CAN_JOIN) });
		return;
	}

	if (attachment.playerId) {
		sendMessage(ws, { type: 'error', ...createError(ErrorCode.ALREADY_JOINED) });
		return;
	}

	// Validate nickname with Zod
	const nicknameResult = nicknameSchema.safeParse(nickname);
	if (!nicknameResult.success) {
		sendMessage(ws, { type: 'error', ...createError(ErrorCode.VALIDATION_ERROR, z.prettifyError(nicknameResult.error)) });
		return;
	}
	const validatedNickname = nicknameResult.data;

	const state = await getFullGameState();
	if (!state || state.phase !== 'LOBBY') {
		sendMessage(ws, { type: 'error', ...createError(ErrorCode.GAME_NOT_IN_LOBBY) });
		return;
	}

	if (state.players.length >= MAX_PLAYERS) {
		sendMessage(ws, { type: 'error', ...createError(ErrorCode.GAME_FULL) });
		return;
	}

	if (state.players.some((p) => p.name.toLowerCase() === validatedNickname.toLowerCase())) {
		sendMessage(ws, { type: 'error', ...createError(ErrorCode.NICKNAME_TAKEN) });
		return;
	}

	const playerId = crypto.randomUUID();
	const playerToken = crypto.randomUUID();
	const newPlayer: Player = { id: playerId, name: validatedNickname, score: 0, answered: false, token: playerToken };
	state.players.push(newPlayer);
	await ctx.storage.put('game_state', state);

	// Update WebSocket attachment with playerId
	ws.serializeAttachment({
		...attachment,
		playerId,
	} as WebSocketAttachment);

	// Send confirmation to the joining player with their secure token
	sendMessage(ws, { type: 'connected', role: 'player', playerId, playerToken });

	// Broadcast lobby update to all connected clients
	broadcastLobbyUpdate(ctx, state);
}

/**
 * Handle host starting the game.
 */
export async function handleStartGame(
	ctx: HandlerContext,
	ws: WebSocket,
	attachment: WebSocketAttachment,
	getFullGameState: () => Promise<GameState | null>,
): Promise<void> {
	if (attachment.role !== 'host') {
		sendMessage(ws, { type: 'error', ...createError(ErrorCode.ONLY_HOST_CAN_START) });
		return;
	}

	const state = await getFullGameState();
	if (!state || state.phase !== 'LOBBY') {
		sendMessage(ws, { type: 'error', ...createError(ErrorCode.GAME_NOT_IN_LOBBY) });
		return;
	}

	// Transition to GET_READY phase with countdown before first question
	state.phase = 'GET_READY';
	await ctx.storage.put('game_state', state);

	// Broadcast get ready message to all clients
	broadcastGetReady(ctx, state);

	// Schedule automatic transition to QUESTION phase after countdown
	await ctx.setAlarm(Date.now() + getReadyCountdownMs(ctx.env));
}

/**
 * Handle player submitting an answer.
 */
export async function handleSubmitAnswer(
	ctx: HandlerContext,
	ws: WebSocket,
	attachment: WebSocketAttachment,
	answerIndex: number,
	getFullGameState: () => Promise<GameState | null>,
): Promise<void> {
	if (attachment.role !== 'player' || !attachment.playerId) {
		sendMessage(ws, { type: 'error', ...createError(ErrorCode.ONLY_PLAYERS_CAN_ANSWER) });
		return;
	}

	// Validate answer index
	if (typeof answerIndex !== 'number' || answerIndex < 0 || answerIndex >= LIMITS.OPTIONS_MAX) {
		sendMessage(ws, { type: 'error', ...createError(ErrorCode.INVALID_ANSWER_INDEX) });
		return;
	}

	const state = await getFullGameState();
	if (!state || state.phase !== 'QUESTION') {
		sendMessage(ws, { type: 'error', ...createError(ErrorCode.NOT_IN_QUESTION_PHASE) });
		return;
	}

	const playerId = attachment.playerId;
	if (state.answers.some((a) => a.playerId === playerId)) {
		sendMessage(ws, { type: 'error', ...createError(ErrorCode.ALREADY_ANSWERED) });
		return;
	}

	const timeTaken = Date.now() - state.questionStartTime;
	if (timeTaken > QUESTION_TIME_LIMIT_MS) {
		sendMessage(ws, { type: 'error', ...createError(ErrorCode.TIME_EXPIRED) });
		return;
	}

	const answer: Answer = { playerId, answerIndex, time: timeTaken };
	state.answers.push(answer);
	await ctx.storage.put('game_state', state);

	// Confirm to player
	sendMessage(ws, { type: 'answerReceived', answerIndex });

	// Notify host of answer count
	broadcastToRole(ctx, 'host', {
		type: 'playerAnswered',
		playerId,
		answeredCount: state.answers.length,
		totalPlayers: state.players.length,
	});

	// Auto-advance to reveal if all players answered (after a short delay)
	if (state.answers.length === state.players.length) {
		const elapsed = Date.now() - state.questionStartTime;
		const remainingTime = QUESTION_TIME_LIMIT_MS - elapsed;
		const delay = Math.min(ALL_ANSWERED_DELAY_MS, Math.max(0, remainingTime));
		await ctx.setAlarm(Date.now() + delay);
	}
}

/**
 * Handle player sending an emoji reaction.
 */
export async function handleSendEmoji(
	ctx: HandlerContext,
	ws: WebSocket,
	attachment: WebSocketAttachment,
	emoji: EmojiReaction,
	getFullGameState: () => Promise<GameState | null>,
): Promise<void> {
	if (attachment.role !== 'player' || !attachment.playerId) {
		sendMessage(ws, { type: 'error', ...createError(ErrorCode.ONLY_PLAYERS_CAN_SEND_EMOJI) });
		return;
	}

	const state = await getFullGameState();
	if (!state) return;
	if (!phaseAllowsEmoji[state.phase]) {
		return;
	}

	// Broadcast emoji to host only
	broadcastToRole(ctx, 'host', {
		type: 'emojiReceived',
		emoji,
		playerId: attachment.playerId,
	});
}

/**
 * Advance the game state to the reveal phase.
 */
export async function advanceToReveal(ctx: HandlerContext, state: GameState): Promise<void> {
	processAnswersAndUpdateScores(state);
	state.phase = 'REVEAL';
	await ctx.storage.put('game_state', state);

	// Broadcast reveal with appropriate data for each role
	broadcastReveal(ctx, state);
}

/**
 * Handle host advancing to the next game state.
 */
export async function handleNextState(
	ctx: HandlerContext,
	ws: WebSocket,
	attachment: WebSocketAttachment,
	getFullGameState: () => Promise<GameState | null>,
): Promise<void> {
	if (attachment.role !== 'host') {
		sendMessage(ws, { type: 'error', ...createError(ErrorCode.ONLY_HOST_CAN_ADVANCE) });
		return;
	}

	const state = await getFullGameState();
	if (!state) {
		sendMessage(ws, { type: 'error', ...createError(ErrorCode.GAME_NOT_FOUND) });
		return;
	}

	switch (state.phase) {
		case 'QUESTION':
			await advanceToReveal(ctx, state);
			break;
		case 'REVEAL':
			// After revealing the final question, skip the LEADERBOARD phase
			// and go straight to END_INTRO to show the podium screen without spoilers.
			if (state.currentQuestionIndex >= state.questions.length - 1) {
				state.phase = 'END_INTRO';
				state.players.sort((a, b) => b.score - a.score);
				await ctx.storage.put('game_state', state);
				broadcastGameEnd(ctx, state, false);
				// Schedule transition to END_REVEALED after intro animation
				await ctx.setAlarm(Date.now() + END_REVEAL_DELAY_MS);
			} else {
				state.phase = 'LEADERBOARD';
				state.players.sort((a, b) => b.score - a.score);
				await ctx.storage.put('game_state', state);
				broadcastLeaderboard(ctx, state);
			}
			break;
		case 'LEADERBOARD':
			if (state.currentQuestionIndex < state.questions.length - 1) {
				state.currentQuestionIndex++;
				state.answers = [];
				state.players.forEach((p) => (p.answered = false));
				// Check if next question has modifiers
				if (questionHasModifiers(state)) {
					state.phase = 'QUESTION_MODIFIER';
					await ctx.storage.put('game_state', state);
					broadcastQuestionModifier(ctx, state);
					// Schedule automatic transition to QUESTION after modifier display
					await ctx.setAlarm(Date.now() + QUESTION_MODIFIER_DURATION_MS);
				} else {
					state.phase = 'QUESTION';
					state.questionStartTime = Date.now();
					await ctx.storage.put('game_state', state);
					broadcastQuestionStart(ctx, state);
				}
			} else {
				state.phase = 'END_INTRO';
				await ctx.storage.put('game_state', state);
				broadcastGameEnd(ctx, state, false);
				// Schedule transition to END_REVEALED after intro animation
				await ctx.setAlarm(Date.now() + END_REVEAL_DELAY_MS);
			}
			break;
		case 'LOBBY':
		case 'GET_READY':
		case 'QUESTION_MODIFIER':
		case 'END_INTRO':
		case 'END_REVEALED':
			break;
		default: {
			const _exhaustiveCheck: never = state.phase;
			sendMessage(ws, { type: 'error', ...createError(ErrorCode.INVALID_STATE_TRANSITION) });
			return _exhaustiveCheck;
		}
	}
}
