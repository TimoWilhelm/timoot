import { describe, expect, it } from 'vitest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

interface ApiResponse<T = unknown> {
	success: boolean;
	data?: T;
	error?: string;
}

interface Quiz {
	id: string;
	title: string;
	type: string;
	questions: Question[];
}

interface Question {
	text: string;
	options: string[];
	correctAnswerIndex: number;
}

interface CreateGameData {
	id: string;
	hostSecret: string;
	pin: string;
}

/**
 * Integration tests for REST API endpoints.
 * These test the HTTP API directly without WebSocket game flow.
 */
describe('REST API Integration Tests', () => {
	describe('Health & Availability', () => {
		it('should serve the app root', async () => {
			const response = await fetch(`${BASE_URL}/`);
			expect(response.ok).toBe(true);
		});
	});

	describe('Predefined Quizzes API', () => {
		it('GET /api/quizzes returns predefined quizzes', async () => {
			const response = await fetch(`${BASE_URL}/api/quizzes`);
			expect(response.ok).toBe(true);

			const result = (await response.json()) as ApiResponse<Quiz[]>;
			expect(result.success).toBe(true);
			expect(Array.isArray(result.data)).toBe(true);
			expect(result.data!.length).toBeGreaterThan(0);

			// Each quiz should have required fields
			for (const quiz of result.data!) {
				expect(quiz).toHaveProperty('id');
				expect(quiz).toHaveProperty('title');
				expect(quiz).toHaveProperty('questions');
				expect(quiz.type).toBe('predefined');
			}
		});

		it('predefined quizzes have valid question structure', async () => {
			const response = await fetch(`${BASE_URL}/api/quizzes`);
			const result = (await response.json()) as ApiResponse<Quiz[]>;

			for (const quiz of result.data!) {
				for (const question of quiz.questions) {
					expect(question).toHaveProperty('text');
					expect(question).toHaveProperty('options');
					expect(question).toHaveProperty('correctAnswerIndex');
					expect(question.options.length).toBeGreaterThanOrEqual(2);
					expect(question.correctAnswerIndex).toBeGreaterThanOrEqual(0);
					expect(question.correctAnswerIndex).toBeLessThan(question.options.length);
				}
			}
		});
	});

	describe('Game Creation API', () => {
		it('POST /api/games creates a new game', async () => {
			const response = await fetch(`${BASE_URL}/api/games`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-user-id': `test-user-${Date.now()}`,
					'x-turnstile-token': 'test-token', // Required header (skipped in DEV mode)
				},
				body: JSON.stringify({}),
			});

			expect(response.ok).toBe(true);

			const result = (await response.json()) as ApiResponse<CreateGameData>;
			expect(result.success).toBe(true);
			expect(result.data).toHaveProperty('id'); // API uses 'id', not 'gameId'
			expect(result.data).toHaveProperty('hostSecret');
			expect(result.data).toHaveProperty('pin');

			// PIN should be 6 digits
			expect(result.data!.pin).toMatch(/^\d{6}$/);
		});

		it('POST /api/games with quizId creates game with specified quiz', async () => {
			// First get a predefined quiz ID
			const quizzesResponse = await fetch(`${BASE_URL}/api/quizzes`);
			const quizzesResult = (await quizzesResponse.json()) as ApiResponse<Quiz[]>;
			const quizId = quizzesResult.data![0].id;

			const response = await fetch(`${BASE_URL}/api/games`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-user-id': `test-user-${Date.now()}`,
					'x-turnstile-token': 'test-token',
				},
				body: JSON.stringify({ quizId }),
			});

			expect(response.ok).toBe(true);
			const result = (await response.json()) as ApiResponse<CreateGameData>;
			expect(result.success).toBe(true);
			expect(result.data!.id).toBeTruthy();
		});
	});

	describe('Game Existence Check', () => {
		it('GET /api/games/:gameId/exists returns 200 for existing game', async () => {
			// Create a game first
			const createResponse = await fetch(`${BASE_URL}/api/games`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-user-id': `test-user-${Date.now()}`,
					'x-turnstile-token': 'test-token',
				},
				body: JSON.stringify({}),
			});
			const createResult = (await createResponse.json()) as ApiResponse<CreateGameData>;
			const gameId = createResult.data!.id; // API uses 'id', not 'gameId'

			// Check if it exists
			const existsResponse = await fetch(`${BASE_URL}/api/games/${gameId}/exists`);
			expect(existsResponse.ok).toBe(true);
		});

		it('GET /api/games/:gameId/exists returns 404 for non-existent game', async () => {
			const response = await fetch(`${BASE_URL}/api/games/nonexistent-fake-game/exists`);
			expect(response.status).toBe(404);
		});
	});
});
