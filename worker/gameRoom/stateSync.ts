import {
	buildGameEndMessage,
	buildGetReadyMessage,
	buildLeaderboardMessage,
	buildLobbyMessage,
	buildQuestionMessage,
	buildQuestionModifierMessage,
	buildRevealMessage,
} from '../game';
import { getReadyCountdownMs, sendMessage } from './broadcastHelpers';
import type { GameState } from '@shared/types';

/**
 * Send the current game state to a host WebSocket connection.
 */
export function sendCurrentStateToHost(ws: WebSocket, state: GameState, env: Env): void {
	switch (state.phase) {
		case 'LOBBY':
			sendMessage(ws, buildLobbyMessage(state));
			break;
		case 'GET_READY':
			sendMessage(ws, buildGetReadyMessage(state, getReadyCountdownMs(env)));
			break;
		case 'QUESTION_MODIFIER':
			sendMessage(ws, buildQuestionModifierMessage(state));
			break;
		case 'QUESTION':
			sendMessage(ws, buildQuestionMessage(state));
			break;
		case 'REVEAL':
			sendMessage(ws, buildRevealMessage(state));
			break;
		case 'LEADERBOARD':
			sendMessage(ws, buildLeaderboardMessage(state));
			break;
		case 'END_INTRO':
			sendMessage(ws, buildGameEndMessage(state, false));
			break;
		case 'END_REVEALED':
			sendMessage(ws, buildGameEndMessage(state, true));
			break;
		default: {
			const _exhaustiveCheck: never = state.phase;
			return _exhaustiveCheck;
		}
	}
}

/**
 * Send the current game state to a player WebSocket connection.
 */
export function sendCurrentStateToPlayer(ws: WebSocket, state: GameState, playerId: string, env: Env): void {
	switch (state.phase) {
		case 'LOBBY':
			sendMessage(ws, buildLobbyMessage(state));
			break;
		case 'GET_READY':
			sendMessage(ws, buildGetReadyMessage(state, getReadyCountdownMs(env)));
			break;
		case 'QUESTION_MODIFIER':
			sendMessage(ws, buildQuestionModifierMessage(state));
			break;
		case 'QUESTION': {
			sendMessage(ws, buildQuestionMessage(state));
			// Check if player already answered
			const existingAnswer = state.answers.find((a) => a.playerId === playerId);
			if (existingAnswer) {
				sendMessage(ws, { type: 'answerReceived', answerIndex: existingAnswer.answerIndex });
			}
			break;
		}
		case 'REVEAL':
			sendMessage(ws, buildRevealMessage(state, playerId));
			break;
		case 'LEADERBOARD':
			sendMessage(ws, buildLeaderboardMessage(state));
			break;
		case 'END_INTRO':
			sendMessage(ws, buildGameEndMessage(state, false));
			break;
		case 'END_REVEALED':
			sendMessage(ws, buildGameEndMessage(state, true));
			break;
	}
}
