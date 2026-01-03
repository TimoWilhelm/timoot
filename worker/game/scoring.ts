import { QUESTION_TIME_LIMIT_MS } from './constants';

import type { Answer, GameState, Player } from '@shared/types';

/**
 * Score calculation result for a single answer.
 */
export interface ScoreResult {
	isCorrect: boolean;
	score: number;
}

/**
 * Calculate the score for a single answer.
 * Uses a time-based scoring formula where faster answers get more points.
 *
 * @param answer - The player's answer
 * @param correctAnswerIndex - The correct answer index for the question
 * @param isDoublePoints - Whether the question has double points enabled
 * @returns Score result with correctness and points earned
 */
export function calculateAnswerScore(answer: Answer, correctAnswerIndex: number, isDoublePoints: boolean = false): ScoreResult {
	const isCorrect = correctAnswerIndex === answer.answerIndex;

	if (!isCorrect) {
		return { isCorrect: false, score: 0 };
	}

	const pointMultiplier = isDoublePoints ? 2 : 1;
	const timeFactor = 1 - answer.time / (QUESTION_TIME_LIMIT_MS * 2);
	const score = Math.floor(1000 * timeFactor * pointMultiplier);

	return { isCorrect: true, score };
}

/**
 * Process all answers for the current question and update player scores.
 * Mutates the state's players array and answers array with score data.
 *
 * @param state - The game state to update
 */
export function processAnswersAndUpdateScores(state: GameState): void {
	const currentQuestion = state.questions[state.currentQuestionIndex];

	for (const answer of state.answers) {
		const player = state.players.find((p: Player) => p.id === answer.playerId);
		if (player) {
			const result = calculateAnswerScore(answer, currentQuestion.correctAnswerIndex, currentQuestion.isDoublePoints);
			player.score += result.score;
			answer.isCorrect = result.isCorrect;
			answer.score = result.score;
		}
	}
}

/**
 * Build a sorted leaderboard from the current player list.
 *
 * @param players - The players array from game state
 * @returns Sorted leaderboard with rank information
 */
export function buildLeaderboard(players: Player[]): { id: string; name: string; score: number; rank: number }[] {
	return [...players]
		.toSorted((a, b) => b.score - a.score)
		.map((p, index) => ({ id: p.id, name: p.name, score: p.score, rank: index + 1 }));
}
