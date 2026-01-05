import { describe, expect, it } from 'vitest';

import { QUESTION_TIME_LIMIT_MS } from '../constants';
import { buildLeaderboard, calculateAnswerScore, processAnswersAndUpdateScores } from '../scoring';

import type { Answer, GameState, Player, Question } from '@shared/types';

function createMockState(players: Player[], answers: Answer[], questions: Question[]): GameState {
	return {
		id: 'test-game',
		pin: '1234',
		phase: 'REVEAL',
		players,
		questions,
		currentQuestionIndex: 0,
		questionStartTime: Date.now(),
		answers,
	};
}

describe('scoring.ts', () => {
	describe('calculateAnswerScore', () => {
		it('returns zero score for incorrect answer', () => {
			const answer: Answer = { playerId: 'p1', answerIndex: 0, time: 1000 };
			const result = calculateAnswerScore(answer, 2);

			expect(result.isCorrect).toBe(false);
			expect(result.score).toBe(0);
		});

		it('returns positive score for correct answer', () => {
			const answer: Answer = { playerId: 'p1', answerIndex: 2, time: 1000 };
			const result = calculateAnswerScore(answer, 2);

			expect(result.isCorrect).toBe(true);
			expect(result.score).toBeGreaterThan(0);
		});

		it('gives higher score for faster answers', () => {
			const fastAnswer: Answer = { playerId: 'p1', answerIndex: 1, time: 1000 };
			const slowAnswer: Answer = { playerId: 'p2', answerIndex: 1, time: 15_000 };

			const fastResult = calculateAnswerScore(fastAnswer, 1);
			const slowResult = calculateAnswerScore(slowAnswer, 1);

			expect(fastResult.score).toBeGreaterThan(slowResult.score);
		});

		it('doubles score when isDoublePoints is true', () => {
			const answer: Answer = { playerId: 'p1', answerIndex: 0, time: 5000 };

			const normalResult = calculateAnswerScore(answer, 0, false);
			const doubleResult = calculateAnswerScore(answer, 0, true);

			expect(doubleResult.score).toBe(normalResult.score * 2);
		});

		it('handles edge case of instant answer (time = 0)', () => {
			const answer: Answer = { playerId: 'p1', answerIndex: 0, time: 0 };
			const result = calculateAnswerScore(answer, 0);

			expect(result.isCorrect).toBe(true);
			expect(result.score).toBe(1000); // Max score
		});

		it('handles answer at exactly time limit', () => {
			const answer: Answer = { playerId: 'p1', answerIndex: 0, time: QUESTION_TIME_LIMIT_MS };
			const result = calculateAnswerScore(answer, 0);

			expect(result.isCorrect).toBe(true);
			expect(result.score).toBe(500); // Half of max score
		});
	});

	describe('processAnswersAndUpdateScores', () => {
		it('updates player scores for correct answers', () => {
			const players: Player[] = [{ id: 'p1', name: 'Player 1', score: 0, answered: true }];
			const answers: Answer[] = [{ playerId: 'p1', answerIndex: 0, time: 1000 }];
			const questions: Question[] = [{ text: 'Q1', options: ['A', 'B', 'C', 'D'], correctAnswerIndex: 0 }];

			const state = createMockState(players, answers, questions);
			processAnswersAndUpdateScores(state);

			expect(state.players[0].score).toBeGreaterThan(0);
			expect(state.answers[0].isCorrect).toBe(true);
			expect(state.answers[0].score).toBeGreaterThan(0);
		});

		it('does not update score for incorrect answers', () => {
			const players: Player[] = [{ id: 'p1', name: 'Player 1', score: 100, answered: true }];
			const answers: Answer[] = [{ playerId: 'p1', answerIndex: 1, time: 1000 }];
			const questions: Question[] = [{ text: 'Q1', options: ['A', 'B', 'C', 'D'], correctAnswerIndex: 0 }];

			const state = createMockState(players, answers, questions);
			processAnswersAndUpdateScores(state);

			expect(state.players[0].score).toBe(100); // Unchanged
			expect(state.answers[0].isCorrect).toBe(false);
			expect(state.answers[0].score).toBe(0);
		});

		it('processes multiple players correctly', () => {
			const players: Player[] = [
				{ id: 'p1', name: 'Player 1', score: 0, answered: true },
				{ id: 'p2', name: 'Player 2', score: 0, answered: true },
			];
			const answers: Answer[] = [
				{ playerId: 'p1', answerIndex: 0, time: 1000 }, // Correct
				{ playerId: 'p2', answerIndex: 1, time: 2000 }, // Incorrect
			];
			const questions: Question[] = [{ text: 'Q1', options: ['A', 'B', 'C', 'D'], correctAnswerIndex: 0 }];

			const state = createMockState(players, answers, questions);
			processAnswersAndUpdateScores(state);

			expect(state.players[0].score).toBeGreaterThan(0);
			expect(state.players[1].score).toBe(0);
		});

		it('handles double points questions', () => {
			const players: Player[] = [{ id: 'p1', name: 'Player 1', score: 0, answered: true }];
			const answers: Answer[] = [{ playerId: 'p1', answerIndex: 0, time: 5000 }];
			const questions: Question[] = [{ text: 'Q1', options: ['A', 'B', 'C', 'D'], correctAnswerIndex: 0, isDoublePoints: true }];

			const state = createMockState(players, answers, questions);
			processAnswersAndUpdateScores(state);

			// Verify double points are applied
			const normalScore = calculateAnswerScore(answers[0], 0, false).score;
			expect(state.players[0].score).toBe(normalScore * 2);
		});

		it('ignores answers from non-existent players', () => {
			const players: Player[] = [{ id: 'p1', name: 'Player 1', score: 0, answered: true }];
			const answers: Answer[] = [
				{ playerId: 'p1', answerIndex: 0, time: 1000 },
				{ playerId: 'nonexistent', answerIndex: 0, time: 1000 },
			];
			const questions: Question[] = [{ text: 'Q1', options: ['A', 'B', 'C', 'D'], correctAnswerIndex: 0 }];

			const state = createMockState(players, answers, questions);

			// Should not throw
			expect(() => processAnswersAndUpdateScores(state)).not.toThrow();
		});
	});

	describe('buildLeaderboard', () => {
		it('returns empty array for empty players list', () => {
			const result = buildLeaderboard([]);
			expect(result).toEqual([]);
		});

		it('ranks single player as rank 1', () => {
			const players: Player[] = [{ id: 'p1', name: 'Player 1', score: 100, answered: false }];
			const result = buildLeaderboard(players);

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({ id: 'p1', name: 'Player 1', score: 100, rank: 1 });
		});

		it('sorts players by score descending', () => {
			const players: Player[] = [
				{ id: 'p1', name: 'Low', score: 50, answered: false },
				{ id: 'p2', name: 'High', score: 200, answered: false },
				{ id: 'p3', name: 'Mid', score: 100, answered: false },
			];

			const result = buildLeaderboard(players);

			expect(result[0].name).toBe('High');
			expect(result[1].name).toBe('Mid');
			expect(result[2].name).toBe('Low');
		});

		it('assigns correct ranks', () => {
			const players: Player[] = [
				{ id: 'p1', name: 'A', score: 300, answered: false },
				{ id: 'p2', name: 'B', score: 200, answered: false },
				{ id: 'p3', name: 'C', score: 100, answered: false },
			];

			const result = buildLeaderboard(players);

			expect(result[0].rank).toBe(1);
			expect(result[1].rank).toBe(2);
			expect(result[2].rank).toBe(3);
		});

		it('does not mutate original players array', () => {
			const players: Player[] = [
				{ id: 'p1', name: 'Low', score: 50, answered: false },
				{ id: 'p2', name: 'High', score: 200, answered: false },
			];

			const originalOrder = [...players];
			buildLeaderboard(players);

			expect(players[0].id).toBe(originalOrder[0].id);
			expect(players[1].id).toBe(originalOrder[1].id);
		});

		it('handles players with equal scores', () => {
			const players: Player[] = [
				{ id: 'p1', name: 'A', score: 100, answered: false },
				{ id: 'p2', name: 'B', score: 100, answered: false },
			];

			const result = buildLeaderboard(players);

			// Both should have sequential ranks (not tied ranks)
			expect(result[0].rank).toBe(1);
			expect(result[1].rank).toBe(2);
		});
	});
});
