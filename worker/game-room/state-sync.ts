import {
	QUESTION_READING_MS,
	QUESTION_TIME_LIMIT_MS,
	buildGameEndMessage,
	buildGetReadyMessage,
	buildLeaderboardMessage,
	buildLobbyMessage,
	buildQuestionMessage,
	buildQuestionModifierMessage,
	buildReadingEndMessage,
	buildRevealMessage,
} from '../game';
import { getReadyCountdownMs, sendMessage } from './broadcast-helpers';

import type { GameState } from '@shared/types';

/**
 * Send the current game state to a host WebSocket connection.
 */
export function sendCurrentStateToHost(ws: WebSocket, state: GameState, environment: Env): void {
	switch (state.phase) {
		case 'LOBBY': {
			sendMessage(ws, buildLobbyMessage(state));
			break;
		}
		case 'GET_READY': {
			sendMessage(ws, buildGetReadyMessage(state, getReadyCountdownMs(environment)));
			break;
		}
		case 'QUESTION_MODIFIER': {
			sendMessage(ws, buildQuestionModifierMessage(state));
			break;
		}
		case 'QUESTION:READING': {
			// Reading period still active — send remaining reading duration so the bar picks up mid-way on reconnect
			const readingElapsed = Date.now() - (state.phaseEnteredAt || Date.now());
			const remainingReading = Math.max(0, QUESTION_READING_MS - readingElapsed);
			sendMessage(ws, buildQuestionMessage(state, remainingReading));
			break;
		}
		case 'QUESTION:ANSWERING': {
			// Answering period active — skip reading, send remaining answer time
			sendMessage(ws, buildQuestionMessage(state, 0));
			const remainingMs = Math.max(0, QUESTION_TIME_LIMIT_MS - (Date.now() - state.questionStartTime));
			sendMessage(ws, buildReadingEndMessage(state, remainingMs));
			break;
		}
		case 'REVEAL': {
			sendMessage(ws, buildRevealMessage(state));
			break;
		}
		case 'LEADERBOARD': {
			sendMessage(ws, buildLeaderboardMessage(state));
			break;
		}
		case 'END:INTRO': {
			sendMessage(ws, buildGameEndMessage(state, false));
			break;
		}
		case 'END:REVEALED': {
			sendMessage(ws, buildGameEndMessage(state, true));
			break;
		}
		default: {
			const _exhaustiveCheck: never = state.phase;
			return _exhaustiveCheck;
		}
	}
}

/**
 * Send the current game state to a player WebSocket connection.
 */
export function sendCurrentStateToPlayer(ws: WebSocket, state: GameState, playerId: string, environment: Env): void {
	switch (state.phase) {
		case 'LOBBY': {
			sendMessage(ws, buildLobbyMessage(state));
			break;
		}
		case 'GET_READY': {
			sendMessage(ws, buildGetReadyMessage(state, getReadyCountdownMs(environment)));
			break;
		}
		case 'QUESTION_MODIFIER': {
			sendMessage(ws, buildQuestionModifierMessage(state));
			break;
		}
		case 'QUESTION:READING': {
			// Reading period still active — send remaining reading duration so reconnecting players see accurate state
			const readingElapsed = Date.now() - (state.phaseEnteredAt || Date.now());
			const remainingReading = Math.max(0, QUESTION_READING_MS - readingElapsed);
			sendMessage(ws, buildQuestionMessage(state, remainingReading));
			break;
		}
		case 'QUESTION:ANSWERING': {
			// Answering period active — skip reading, send remaining answer time
			sendMessage(ws, buildQuestionMessage(state, 0));
			const remainingMs = Math.max(0, QUESTION_TIME_LIMIT_MS - (Date.now() - state.questionStartTime));
			sendMessage(ws, buildReadingEndMessage(state, remainingMs));
			// Check if player already answered
			const existingAnswer = state.answers.find((a) => a.playerId === playerId);
			if (existingAnswer) {
				sendMessage(ws, { type: 'answerReceived', answerIndex: existingAnswer.answerIndex });
			}
			break;
		}
		case 'REVEAL': {
			sendMessage(ws, buildRevealMessage(state, playerId));
			break;
		}
		case 'LEADERBOARD': {
			sendMessage(ws, buildLeaderboardMessage(state));
			break;
		}
		case 'END:INTRO': {
			sendMessage(ws, buildGameEndMessage(state, false));
			break;
		}
		case 'END:REVEALED': {
			sendMessage(ws, buildGameEndMessage(state, true));
			break;
		}
	}
}
