import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { z } from 'zod';
import { exports, waitUntil } from 'cloudflare:workers';
import { type GeneratedQuestion, type GenerationStatus, generateQuizFromPrompt, generateSingleQuestion } from '../ai';
import { PREDEFINED_QUIZZES } from '../quizzes';
import { checkRateLimit, getUserIdFromRequest } from './utils';
import { aiGenerateRequestSchema, quizSchema } from '@shared/validation';
import type { ApiResponse, Quiz } from '@shared/types';

/**
 * Register quiz-related routes
 */
export function registerQuizRoutes(app: Hono<{ Bindings: Env }>) {
	// Get predefined quizzes
	app.get('/api/quizzes', (c) => {
		return c.json({ success: true, data: PREDEFINED_QUIZZES } satisfies ApiResponse<Quiz[]>);
	});

	// Get custom quizzes for user
	app.get('/api/quizzes/custom', async (c) => {
		const userId = getUserIdFromRequest(c);
		const quizStoreStub = exports.QuizStoreDurableObject.getByName(`user:${userId}`);
		const data = await quizStoreStub.getCustomQuizzes();
		// Update last activity (non-blocking)
		waitUntil(quizStoreStub.touchLastAccess(userId));
		return c.json({ success: true, data } satisfies ApiResponse<Quiz[]>);
	});

	// Get specific custom quiz
	app.get('/api/quizzes/custom/:id', async (c) => {
		const { id } = c.req.param();
		const userId = getUserIdFromRequest(c);
		const quizStoreStub = exports.QuizStoreDurableObject.getByName(`user:${userId}`);
		const data = await quizStoreStub.getCustomQuizById(id);
		if (!data) {
			return c.json({ success: false, error: 'Quiz not found' }, 404);
		}
		return c.json({ success: true, data } satisfies ApiResponse<Quiz>);
	});

	// Create custom quiz
	app.post('/api/quizzes/custom', async (c) => {
		const body = await c.req.json();
		const result = quizSchema.safeParse(body);
		if (!result.success) {
			return c.json({ success: false, error: z.prettifyError(result.error) } satisfies ApiResponse, 400);
		}
		const userId = getUserIdFromRequest(c);
		const quizStoreStub = exports.QuizStoreDurableObject.getByName(`user:${userId}`);
		const data = await quizStoreStub.saveCustomQuiz(result.data);
		// Update last activity (non-blocking)
		waitUntil(quizStoreStub.touchLastAccess(userId));
		return c.json({ success: true, data }, 201);
	});

	// Update custom quiz
	app.put('/api/quizzes/custom/:id', async (c) => {
		const { id } = c.req.param();
		const body = await c.req.json();
		const result = quizSchema.safeParse(body);
		if (!result.success) {
			return c.json({ success: false, error: z.prettifyError(result.error) } satisfies ApiResponse, 400);
		}
		if (id !== result.data.id) {
			return c.json({ success: false, error: 'ID mismatch' }, 400);
		}
		const userId = getUserIdFromRequest(c);
		const quizStoreStub = exports.QuizStoreDurableObject.getByName(`user:${userId}`);
		const data = await quizStoreStub.saveCustomQuiz(result.data);
		// Update last activity (non-blocking)
		waitUntil(quizStoreStub.touchLastAccess(userId));
		return c.json({ success: true, data });
	});

	// Delete custom quiz
	app.delete('/api/quizzes/custom/:id', async (c) => {
		const { id } = c.req.param();
		const userId = getUserIdFromRequest(c);
		const quizStoreStub = exports.QuizStoreDurableObject.getByName(`user:${userId}`);
		const data = await quizStoreStub.deleteCustomQuiz(id);
		if (!data.success) {
			return c.json({ success: false, error: 'Quiz not found' }, 404);
		}
		// Update last activity (non-blocking)
		waitUntil(quizStoreStub.touchLastAccess(userId));
		return c.json({ success: true });
	});

	// AI Quiz Generation endpoint with SSE streaming for status updates
	app.post('/api/quizzes/generate', async (c) => {
		const rateLimitResponse = await checkRateLimit(c, c.env.AI_RATE_LIMITER, 'quiz-generate');
		if (rateLimitResponse) return rateLimitResponse;

		const body = await c.req.json();
		const result = aiGenerateRequestSchema.safeParse(body);
		if (!result.success) {
			return c.json({ success: false, error: z.prettifyError(result.error) } satisfies ApiResponse, 400);
		}
		const { prompt, numQuestions } = result.data;

		return streamSSE(c, async (stream) => {
			try {
				const onStatusUpdate = (status: GenerationStatus) => {
					stream.writeSSE({ event: 'status', data: JSON.stringify(status) });
				};

				const generatedQuiz = await generateQuizFromPrompt(prompt, numQuestions, c.req.raw.signal, onStatusUpdate, {
					connecting_ip: c.req.header('CF-Connecting-IP') ?? 'unknown',
				});

				// Save the generated quiz as a custom quiz
				const userId = getUserIdFromRequest(c);
				const quizStoreStub = exports.QuizStoreDurableObject.getByName(`user:${userId}`);
				const savedQuiz = await quizStoreStub.saveCustomQuiz({
					title: generatedQuiz.title,
					questions: generatedQuiz.questions,
				});

				await stream.writeSSE({
					event: 'complete',
					data: JSON.stringify({ success: true, data: savedQuiz } satisfies ApiResponse<Quiz>),
				});
			} catch (error) {
				console.error('[AI Quiz Generation Error]', error);
				await stream.writeSSE({
					event: 'error',
					data: JSON.stringify({
						success: false,
						error: error instanceof Error ? error.message : 'Failed to generate quiz',
					} satisfies ApiResponse),
				});
			}
		});
	});

	// AI Single Question Generation endpoint
	app.post('/api/quizzes/generate-question', async (c) => {
		const rateLimitResponse = await checkRateLimit(c, c.env.AI_RATE_LIMITER, 'question-generate');
		if (rateLimitResponse) return rateLimitResponse;

		const body = await c.req.json();
		const schema = z.object({
			title: z.string().min(1, 'Quiz title is required'),
			existingQuestions: z
				.array(
					z.object({
						text: z.string(),
						options: z.array(z.string()),
						correctAnswerIndex: z.number(),
					}),
				)
				.optional()
				.default([]),
		});

		const result = schema.safeParse(body);
		if (!result.success) {
			return c.json({ success: false, error: z.prettifyError(result.error) } satisfies ApiResponse, 400);
		}

		try {
			const { title, existingQuestions } = result.data;
			const question = await generateSingleQuestion(title, existingQuestions, c.req.raw.signal, {
				connecting_ip: c.req.header('CF-Connecting-IP') ?? 'unknown',
			});
			return c.json({ success: true, data: question } satisfies ApiResponse<GeneratedQuestion>);
		} catch (error) {
			console.error('[AI Question Generation Error]', error);
			return c.json(
				{
					success: false,
					error: error instanceof Error ? error.message : 'Failed to generate question',
				} satisfies ApiResponse,
				500,
			);
		}
	});
}
