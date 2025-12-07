import type { GameState, ServerMessage } from '@shared/types';
import { QUESTION_TIME_LIMIT_MS } from './constants';
import { buildLeaderboard } from './scoring';

/**
 * Build a lobby update message with current players.
 */
export function buildLobbyMessage(state: GameState): ServerMessage {
	return {
		type: 'lobbyUpdate',
		players: state.players.map((p) => ({ id: p.id, name: p.name })),
		pin: state.pin,
		gameId: state.id,
	};
}

/**
 * Build a question start message for broadcasting to all clients.
 */
export function buildQuestionMessage(state: GameState): ServerMessage {
	const question = state.questions[state.currentQuestionIndex];
	return {
		type: 'questionStart',
		questionIndex: state.currentQuestionIndex,
		totalQuestions: state.questions.length,
		questionText: question.text,
		options: question.options,
		startTime: state.questionStartTime,
		timeLimitMs: QUESTION_TIME_LIMIT_MS,
		isDoublePoints: question.isDoublePoints,
		backgroundImage: question.backgroundImage,
	};
}

/**
 * Build answer distribution counts for the current question.
 * Returns an array where each index represents an option and the value is the count.
 */
export function buildAnswerCounts(state: GameState): number[] {
	const question = state.questions[state.currentQuestionIndex];
	const answerCounts = new Array(question.options.length).fill(0);
	state.answers.forEach((a) => {
		if (a.answerIndex >= 0 && a.answerIndex < answerCounts.length) {
			answerCounts[a.answerIndex]++;
		}
	});
	return answerCounts;
}

/**
 * Build a reveal message showing the correct answer and optionally player's result.
 *
 * @param state - Current game state
 * @param playerId - Optional player ID to include their individual result
 */
export function buildRevealMessage(state: GameState, playerId?: string): ServerMessage {
	const question = state.questions[state.currentQuestionIndex];
	const answerCounts = buildAnswerCounts(state);
	const playerAnswer = playerId ? state.answers.find((a) => a.playerId === playerId) : undefined;

	return {
		type: 'reveal',
		correctAnswerIndex: question.correctAnswerIndex,
		playerResult: playerAnswer
			? { isCorrect: playerAnswer.isCorrect ?? false, score: playerAnswer.score ?? 0, answerIndex: playerAnswer.answerIndex }
			: undefined,
		answerCounts,
		questionText: question.text,
		options: question.options,
	};
}

/**
 * Build a leaderboard message showing current standings.
 */
export function buildLeaderboardMessage(state: GameState): ServerMessage {
	return {
		type: 'leaderboard',
		leaderboard: buildLeaderboard(state.players),
		isLastQuestion: state.currentQuestionIndex >= state.questions.length - 1,
	};
}

/**
 * Build a game end message with final standings.
 */
export function buildGameEndMessage(state: GameState): ServerMessage {
	return { type: 'gameEnd', finalLeaderboard: buildLeaderboard(state.players) };
}
