import { z } from 'zod';

import { ErrorCode, createError } from '@shared/errors';
import { phaseAllowsEmoji } from '@shared/phase-rules';
import { LIMITS, nicknameSchema } from '@shared/validation';

import {
	ALL_ANSWERED_DELAY_MS,
	END_REVEAL_DELAY_MS,
	MAX_PLAYERS,
	QUESTION_MODIFIER_DURATION_MS,
	QUESTION_TIME_LIMIT_MS,
	processAnswersAndUpdateScores,
	questionHasModifiers,
} from '../game';
import {
	type BroadcastContext,
	broadcastGameEnd,
	broadcastGetReady,
	broadcastLeaderboard,
	broadcastLobbyUpdate,
	broadcastQuestionModifier,
	broadcastQuestionStart,
	broadcastReveal,
	broadcastToRole,
	getReadyCountdownMs,
	sendMessage,
} from './broadcast-helpers';
import { sendCurrentStateToPlayer } from './state-sync';
import { type WebSocketAttachment } from './types';

import type { Answer, ClientMessage, EmojiReaction, GameState, Player } from '@shared/types';

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
	context: HandlerContext,
	ws: WebSocket,
	data: Extract<ClientMessage, { type: 'connect' }>,
	getFullGameState: () => Promise<GameState | undefined>,
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
	const existingPlayer = playerId ? state.players.find((p) => p.id === playerId) : undefined;

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
		} satisfies WebSocketAttachment);

		// Send back the token so client can verify/restore it
		sendMessage(ws, { type: 'connected', role: 'player', playerId, playerToken: existingPlayer.token });
		sendCurrentStateToPlayer(ws, state, playerId!, context.env);
	} else {
		// New player - needs to join
		ws.serializeAttachment({
			role: 'player',
			authenticated: true, // Authenticated but not yet joined
		} satisfies WebSocketAttachment);

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
	context: HandlerContext,
	ws: WebSocket,
	attachment: WebSocketAttachment,
	nickname: string,
	getFullGameState: () => Promise<GameState | undefined>,
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
	await context.storage.put('game_state', state);

	// Update WebSocket attachment with playerId
	ws.serializeAttachment({
		...attachment,
		playerId,
	} satisfies WebSocketAttachment);

	// Send confirmation to the joining player with their secure token
	sendMessage(ws, { type: 'connected', role: 'player', playerId, playerToken });

	// Broadcast lobby update to all connected clients
	broadcastLobbyUpdate(context, state);
}

/**
 * Handle host starting the game.
 */
export async function handleStartGame(
	context: HandlerContext,
	ws: WebSocket,
	attachment: WebSocketAttachment,
	getFullGameState: () => Promise<GameState | undefined>,
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
	await context.storage.put('game_state', state);

	// Broadcast get ready message to all clients
	broadcastGetReady(context, state);

	// Schedule automatic transition to QUESTION phase after countdown
	await context.setAlarm(Date.now() + getReadyCountdownMs(context.env));
}

/**
 * Handle player submitting an answer.
 */
export async function handleSubmitAnswer(
	context: HandlerContext,
	ws: WebSocket,
	attachment: WebSocketAttachment,
	answerIndex: number,
	getFullGameState: () => Promise<GameState | undefined>,
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
	await context.storage.put('game_state', state);

	// Confirm to player
	sendMessage(ws, { type: 'answerReceived', answerIndex });

	// Notify host of answer count
	broadcastToRole(context, 'host', {
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
		await context.setAlarm(Date.now() + delay);
	}
}

/**
 * Handle player sending an emoji reaction.
 */
export async function handleSendEmoji(
	context: HandlerContext,
	ws: WebSocket,
	attachment: WebSocketAttachment,
	emoji: EmojiReaction,
	getFullGameState: () => Promise<GameState | undefined>,
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
	broadcastToRole(context, 'host', {
		type: 'emojiReceived',
		emoji,
		playerId: attachment.playerId,
	});
}

/**
 * Advance the game state to the reveal phase.
 */
export async function advanceToReveal(context: HandlerContext, state: GameState): Promise<void> {
	processAnswersAndUpdateScores(state);
	state.phase = 'REVEAL';
	await context.storage.put('game_state', state);

	// Broadcast reveal with appropriate data for each role
	broadcastReveal(context, state);
}

/**
 * Handle host advancing to the next game state.
 */
export async function handleNextState(
	context: HandlerContext,
	ws: WebSocket,
	attachment: WebSocketAttachment,
	getFullGameState: () => Promise<GameState | undefined>,
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
		case 'QUESTION': {
			await advanceToReveal(context, state);
			break;
		}
		case 'REVEAL': {
			// After revealing the final question, skip the LEADERBOARD phase
			// and go straight to END_INTRO to show the podium screen without spoilers.
			if (state.currentQuestionIndex >= state.questions.length - 1) {
				state.phase = 'END_INTRO';
				state.players.sort((a, b) => b.score - a.score);
				await context.storage.put('game_state', state);
				broadcastGameEnd(context, state, false);
				// Schedule transition to END_REVEALED after intro animation
				await context.setAlarm(Date.now() + END_REVEAL_DELAY_MS);
			} else {
				state.phase = 'LEADERBOARD';
				state.players.sort((a, b) => b.score - a.score);
				await context.storage.put('game_state', state);
				broadcastLeaderboard(context, state);
			}
			break;
		}
		case 'LEADERBOARD': {
			if (state.currentQuestionIndex < state.questions.length - 1) {
				state.currentQuestionIndex++;
				state.answers = [];
				for (const p of state.players) p.answered = false;
				// Check if next question has modifiers
				if (questionHasModifiers(state)) {
					state.phase = 'QUESTION_MODIFIER';
					await context.storage.put('game_state', state);
					broadcastQuestionModifier(context, state);
					// Schedule automatic transition to QUESTION after modifier display
					await context.setAlarm(Date.now() + QUESTION_MODIFIER_DURATION_MS);
				} else {
					state.phase = 'QUESTION';
					state.questionStartTime = Date.now();
					await context.storage.put('game_state', state);
					broadcastQuestionStart(context, state);
				}
			} else {
				state.phase = 'END_INTRO';
				await context.storage.put('game_state', state);
				broadcastGameEnd(context, state, false);
				// Schedule transition to END_REVEALED after intro animation
				await context.setAlarm(Date.now() + END_REVEAL_DELAY_MS);
			}
			break;
		}
		case 'LOBBY':
		case 'GET_READY':
		case 'QUESTION_MODIFIER':
		case 'END_INTRO':
		case 'END_REVEALED': {
			break;
		}
		default: {
			const _exhaustiveCheck: never = state.phase;
			sendMessage(ws, { type: 'error', ...createError(ErrorCode.INVALID_STATE_TRANSITION) });
			return _exhaustiveCheck;
		}
	}
}
