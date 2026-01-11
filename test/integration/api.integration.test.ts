import { describe, expect, it } from 'vitest';
import { z } from 'zod';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

// Helper to safely parse JSON response in tests with Zod validation
async function parseJson<T>(response: Response, schema: z.Schema<T>): Promise<T> {
	const json = await response.json();
	return schema.parse(json);
}

// Zod schemas for test data
const questionSchema = z.object({
	text: z.string(),
	options: z.array(z.string()),
	correctAnswerIndex: z.number(),
});

const quizSchema = z.object({
	id: z.string(),
	title: z.string(),
	type: z.string(),
	questions: z.array(questionSchema),
});

const createGameDataSchema = z.object({
	id: z.string(),
	hostSecret: z.string(),
	pin: z.string(),
});

const apiResponseSchema = <T extends z.ZodTypeAny>(schema: T) =>
	z.object({
		success: z.boolean(),
		data: schema.optional(),
		error: z.string().optional(),
	});

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

			const result = await parseJson(response, apiResponseSchema(z.array(quizSchema)));
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
			const result = await parseJson(response, apiResponseSchema(z.array(quizSchema)));

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

			const result = await parseJson(response, apiResponseSchema(createGameDataSchema));
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
			const quizzesResult = await parseJson(quizzesResponse, apiResponseSchema(z.array(quizSchema)));
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
			const result = await parseJson(response, apiResponseSchema(createGameDataSchema));
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
			const createResult = await parseJson(createResponse, apiResponseSchema(createGameDataSchema));
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
