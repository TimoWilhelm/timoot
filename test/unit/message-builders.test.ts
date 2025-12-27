import { describe, expect, it } from 'vitest';
import {
	buildAnswerCounts,
	buildGameEndMessage,
	buildLeaderboardMessage,
	buildLobbyMessage,
	buildQuestionMessage,
	buildRevealMessage,
} from '../../worker/game/message-builders';
import { QUESTION_TIME_LIMIT_MS } from '../../worker/game/constants';
import type { GameState } from '@shared/types';

const createMockState = (overrides: Partial<GameState> = {}): GameState => ({
	id: 'test-game-id',
	pin: '1234',
	phase: 'LOBBY',
	players: [
		{ id: 'p1', name: 'Alice', score: 100, answered: false },
		{ id: 'p2', name: 'Bob', score: 50, answered: false },
	],
	questions: [
		{ text: 'Question 1?', options: ['A', 'B', 'C', 'D'], correctAnswerIndex: 0 },
		{ text: 'Question 2?', options: ['X', 'Y', 'Z'], correctAnswerIndex: 2, isDoublePoints: true },
	],
	currentQuestionIndex: 0,
	questionStartTime: 1_700_000_000_000,
	answers: [],
	...overrides,
});

describe('messageBuilders.ts', () => {
	describe('buildLobbyMessage', () => {
		it('returns correct message type', () => {
			const state = createMockState();
			const message = buildLobbyMessage(state);

			expect(message.type).toBe('lobbyUpdate');
		});

		it('includes all players with id and name only', () => {
			const state = createMockState();
			const message = buildLobbyMessage(state);

			expect(message).toHaveProperty('players');
			if (message.type === 'lobbyUpdate') {
				expect(message.players).toHaveLength(2);
				expect(message.players[0]).toEqual({ id: 'p1', name: 'Alice' });
				expect(message.players[1]).toEqual({ id: 'p2', name: 'Bob' });
			}
		});

		it('includes pin and gameId', () => {
			const state = createMockState();
			const message = buildLobbyMessage(state);

			if (message.type === 'lobbyUpdate') {
				expect(message.pin).toBe('1234');
				expect(message.gameId).toBe('test-game-id');
			}
		});

		it('handles empty players list', () => {
			const state = createMockState({ players: [] });
			const message = buildLobbyMessage(state);

			if (message.type === 'lobbyUpdate') {
				expect(message.players).toEqual([]);
			}
		});
	});

	describe('buildQuestionMessage', () => {
		it('returns correct message type', () => {
			const state = createMockState();
			const message = buildQuestionMessage(state);

			expect(message.type).toBe('questionStart');
		});

		it('includes question data from current index', () => {
			const state = createMockState({ currentQuestionIndex: 0 });
			const message = buildQuestionMessage(state);

			if (message.type === 'questionStart') {
				expect(message.questionText).toBe('Question 1?');
				expect(message.options).toEqual(['A', 'B', 'C', 'D']);
				expect(message.questionIndex).toBe(0);
				expect(message.totalQuestions).toBe(2);
			}
		});

		it('includes timing information', () => {
			const state = createMockState({ questionStartTime: 1_700_000_000_000 });
			const message = buildQuestionMessage(state);

			if (message.type === 'questionStart') {
				expect(message.startTime).toBe(1_700_000_000_000);
				expect(message.timeLimitMs).toBe(QUESTION_TIME_LIMIT_MS);
			}
		});

		it('includes isDoublePoints when applicable', () => {
			const state = createMockState({ currentQuestionIndex: 1 });
			const message = buildQuestionMessage(state);

			if (message.type === 'questionStart') {
				expect(message.isDoublePoints).toBe(true);
			}
		});

		it('handles different question indices', () => {
			const state = createMockState({ currentQuestionIndex: 1 });
			const message = buildQuestionMessage(state);

			if (message.type === 'questionStart') {
				expect(message.questionText).toBe('Question 2?');
				expect(message.options).toEqual(['X', 'Y', 'Z']);
				expect(message.questionIndex).toBe(1);
			}
		});
	});

	describe('buildAnswerCounts', () => {
		it('returns array of zeros when no answers', () => {
			const state = createMockState({ answers: [] });
			const counts = buildAnswerCounts(state);

			expect(counts).toEqual([0, 0, 0, 0]);
		});

		it('counts answers per option correctly', () => {
			const state = createMockState({
				answers: [
					{ playerId: 'p1', answerIndex: 0, time: 1000 },
					{ playerId: 'p2', answerIndex: 0, time: 2000 },
					{ playerId: 'p3', answerIndex: 2, time: 3000 },
				],
			});
			const counts = buildAnswerCounts(state);

			expect(counts).toEqual([2, 0, 1, 0]);
		});

		it('ignores invalid answer indices (negative)', () => {
			const state = createMockState({
				answers: [
					{ playerId: 'p1', answerIndex: -1, time: 1000 },
					{ playerId: 'p2', answerIndex: 0, time: 2000 },
				],
			});
			const counts = buildAnswerCounts(state);

			expect(counts).toEqual([1, 0, 0, 0]);
		});

		it('ignores invalid answer indices (out of bounds)', () => {
			const state = createMockState({
				answers: [
					{ playerId: 'p1', answerIndex: 10, time: 1000 },
					{ playerId: 'p2', answerIndex: 1, time: 2000 },
				],
			});
			const counts = buildAnswerCounts(state);

			expect(counts).toEqual([0, 1, 0, 0]);
		});

		it('respects current question options length', () => {
			const state = createMockState({
				currentQuestionIndex: 1, // Has 3 options
				answers: [{ playerId: 'p1', answerIndex: 2, time: 1000 }],
			});
			const counts = buildAnswerCounts(state);

			expect(counts).toHaveLength(3);
			expect(counts).toEqual([0, 0, 1]);
		});
	});

	describe('buildRevealMessage', () => {
		it('returns correct message type', () => {
			const state = createMockState();
			const message = buildRevealMessage(state);

			expect(message.type).toBe('reveal');
		});

		it('includes correct answer index', () => {
			const state = createMockState({ currentQuestionIndex: 0 });
			const message = buildRevealMessage(state);

			if (message.type === 'reveal') {
				expect(message.correctAnswerIndex).toBe(0);
			}
		});

		it('includes answer counts', () => {
			const state = createMockState({
				answers: [
					{ playerId: 'p1', answerIndex: 0, time: 1000, isCorrect: true, score: 900 },
					{ playerId: 'p2', answerIndex: 1, time: 2000, isCorrect: false, score: 0 },
				],
			});
			const message = buildRevealMessage(state);

			if (message.type === 'reveal') {
				expect(message.answerCounts).toEqual([1, 1, 0, 0]);
			}
		});

		it('includes player result when playerId is provided', () => {
			const state = createMockState({
				answers: [{ playerId: 'p1', answerIndex: 0, time: 1000, isCorrect: true, score: 900 }],
			});
			const message = buildRevealMessage(state, 'p1');

			if (message.type === 'reveal') {
				expect(message.playerResult).toEqual({
					isCorrect: true,
					score: 900,
					answerIndex: 0,
				});
			}
		});

		it('returns undefined playerResult when player did not answer', () => {
			const state = createMockState({ answers: [] });
			const message = buildRevealMessage(state, 'p1');

			if (message.type === 'reveal') {
				expect(message.playerResult).toBeUndefined();
			}
		});

		it('returns undefined playerResult when no playerId provided', () => {
			const state = createMockState({
				answers: [{ playerId: 'p1', answerIndex: 0, time: 1000, isCorrect: true, score: 900 }],
			});
			const message = buildRevealMessage(state);

			if (message.type === 'reveal') {
				expect(message.playerResult).toBeUndefined();
			}
		});

		it('defaults isCorrect and score when not set on answer', () => {
			const state = createMockState({
				answers: [{ playerId: 'p1', answerIndex: 2, time: 1000 }],
			});
			const message = buildRevealMessage(state, 'p1');

			if (message.type === 'reveal') {
				expect(message.playerResult).toEqual({
					isCorrect: false,
					score: 0,
					answerIndex: 2,
				});
			}
		});
	});

	describe('buildLeaderboardMessage', () => {
		it('returns correct message type', () => {
			const state = createMockState();
			const message = buildLeaderboardMessage(state);

			expect(message.type).toBe('leaderboard');
		});

		it('includes sorted leaderboard', () => {
			const state = createMockState({
				players: [
					{ id: 'p1', name: 'Low', score: 50, answered: false },
					{ id: 'p2', name: 'High', score: 200, answered: false },
				],
			});
			const message = buildLeaderboardMessage(state);

			if (message.type === 'leaderboard') {
				expect(message.leaderboard[0].name).toBe('High');
				expect(message.leaderboard[1].name).toBe('Low');
			}
		});

		it('correctly identifies last question', () => {
			const state = createMockState({
				currentQuestionIndex: 1, // Last question (index 1 of 2)
			});
			const message = buildLeaderboardMessage(state);

			if (message.type === 'leaderboard') {
				expect(message.isLastQuestion).toBe(true);
			}
		});

		it('correctly identifies not last question', () => {
			const state = createMockState({
				currentQuestionIndex: 0, // First question (index 0 of 2)
			});
			const message = buildLeaderboardMessage(state);

			if (message.type === 'leaderboard') {
				expect(message.isLastQuestion).toBe(false);
			}
		});
	});

	describe('buildGameEndMessage', () => {
		it('returns correct message type', () => {
			const state = createMockState();
			const message = buildGameEndMessage(state, false);

			expect(message.type).toBe('gameEnd');
		});

		it('includes revealed flag based on parameter', () => {
			const state = createMockState();
			const introMessage = buildGameEndMessage(state, false);
			const revealedMessage = buildGameEndMessage(state, true);

			if (introMessage.type === 'gameEnd') {
				expect(introMessage.revealed).toBe(false);
			}
			if (revealedMessage.type === 'gameEnd') {
				expect(revealedMessage.revealed).toBe(true);
			}
		});

		it('includes final leaderboard sorted by score', () => {
			const state = createMockState({
				players: [
					{ id: 'p1', name: 'Third', score: 100, answered: false },
					{ id: 'p2', name: 'First', score: 500, answered: false },
					{ id: 'p3', name: 'Second', score: 300, answered: false },
				],
			});
			const message = buildGameEndMessage(state, true);

			if (message.type === 'gameEnd') {
				expect(message.finalLeaderboard).toHaveLength(3);
				expect(message.finalLeaderboard[0].name).toBe('First');
				expect(message.finalLeaderboard[0].rank).toBe(1);
				expect(message.finalLeaderboard[1].name).toBe('Second');
				expect(message.finalLeaderboard[1].rank).toBe(2);
				expect(message.finalLeaderboard[2].name).toBe('Third');
				expect(message.finalLeaderboard[2].rank).toBe(3);
			}
		});
	});
});
