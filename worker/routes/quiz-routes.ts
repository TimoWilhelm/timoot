import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { exports, waitUntil } from 'cloudflare:workers';
import { type GeneratedQuestion, type GenerationStatus, generateQuizFromPrompt, generateSingleQuestion } from '../ai';
import { PREDEFINED_QUIZZES } from '../quizzes';
import { checkRateLimit } from './utils';
import { withUserId, withProtectedHeader, getUserId, verifyTurnstile } from './validators';
import { aiGenerateRequestSchema, quizSchema } from '@shared/validation';
import type { ApiResponse, Quiz } from '@shared/types';

/**
 * Quiz routes with RPC-compatible chained methods.
 * Routes are chained to enable type inference for the Hono client.
 */
export const quizRoutes = new Hono<{ Bindings: Env }>()
	// Get predefined quizzes (no auth required)
	.get('/api/quizzes', (c) => {
		return c.json({ success: true, data: PREDEFINED_QUIZZES } satisfies ApiResponse<Quiz[]>, 200, {
			'Cache-Control': 'public, max-age=3600',
		});
	})

	// Get custom quizzes for user
	.get('/api/quizzes/custom', withUserId, async (c) => {
		const userId = getUserId(c);
		const quizStoreStub = exports.QuizStoreDurableObject.getByName(`user:${userId}`);
		const data = await quizStoreStub.getCustomQuizzes();
		// Update last activity (non-blocking)
		waitUntil(quizStoreStub.touchLastAccess(userId));
		return c.json({ success: true, data } satisfies ApiResponse<Quiz[]>);
	})

	// Get specific custom quiz
	.get('/api/quizzes/custom/:id', withUserId, async (c) => {
		const { id } = c.req.param();
		const userId = getUserId(c);
		const quizStoreStub = exports.QuizStoreDurableObject.getByName(`user:${userId}`);
		const data = await quizStoreStub.getCustomQuizById(id);
		if (!data) {
			return c.json({ success: false, error: 'Quiz not found' }, 404);
		}
		return c.json({ success: true, data } satisfies ApiResponse<Quiz>);
	})

	// Create custom quiz
	.post('/api/quizzes/custom', withUserId, zValidator('json', quizSchema), async (c) => {
		const quiz = c.req.valid('json');
		const userId = getUserId(c);
		const quizStoreStub = exports.QuizStoreDurableObject.getByName(`user:${userId}`);
		const data = await quizStoreStub.saveCustomQuiz(quiz);
		// Update last activity (non-blocking)
		waitUntil(quizStoreStub.touchLastAccess(userId));
		return c.json({ success: true, data } satisfies ApiResponse<Quiz>, 201);
	})

	// Update custom quiz
	.put('/api/quizzes/custom/:id', withUserId, zValidator('json', quizSchema), async (c) => {
		const { id } = c.req.param();
		const quiz = c.req.valid('json');
		if (id !== quiz.id) {
			return c.json({ success: false, error: 'ID mismatch' }, 400);
		}
		const userId = getUserId(c);
		const quizStoreStub = exports.QuizStoreDurableObject.getByName(`user:${userId}`);
		const data = await quizStoreStub.saveCustomQuiz(quiz);
		// Update last activity (non-blocking)
		waitUntil(quizStoreStub.touchLastAccess(userId));
		return c.json({ success: true, data } satisfies ApiResponse<Quiz>);
	})

	// Delete custom quiz
	.delete('/api/quizzes/custom/:id', withUserId, async (c) => {
		const { id } = c.req.param();
		const userId = getUserId(c);
		const quizStoreStub = exports.QuizStoreDurableObject.getByName(`user:${userId}`);
		const data = await quizStoreStub.deleteCustomQuiz(id);
		if (!data.success) {
			return c.json({ success: false, error: 'Quiz not found' }, 404);
		}
		// Update last activity (non-blocking)
		waitUntil(quizStoreStub.touchLastAccess(userId));
		return c.json({ success: true });
	})

	// AI Quiz Generation endpoint with SSE streaming for status updates
	// Note: SSE endpoints don't work well with hc client, use fetch directly
	.post('/api/quizzes/generate', withProtectedHeader, verifyTurnstile, zValidator('json', aiGenerateRequestSchema), async (c) => {
		const rateLimitResponse = await checkRateLimit(c, c.env.AI_RATE_LIMITER, 'quiz-generate');
		if (rateLimitResponse) return rateLimitResponse;

		const { prompt, numQuestions } = c.req.valid('json');

		return streamSSE(c, async (stream) => {
			try {
				const onStatusUpdate = (status: GenerationStatus) => {
					stream.writeSSE({ event: 'status', data: JSON.stringify(status) });
				};

				const generatedQuiz = await generateQuizFromPrompt(prompt, numQuestions, c.req.raw.signal, onStatusUpdate, {
					connecting_ip: c.req.header('CF-Connecting-IP') ?? 'unknown',
				});

				// Save the generated quiz as a custom quiz
				const userId = getUserId(c);
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
	})

	// AI Single Question Generation endpoint
	.post(
		'/api/quizzes/generate-question',
		withProtectedHeader,
		verifyTurnstile,
		zValidator(
			'json',
			z.object({
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
			}),
		),
		async (c) => {
			const rateLimitResponse = await checkRateLimit(c, c.env.AI_RATE_LIMITER, 'question-generate');
			if (rateLimitResponse) return rateLimitResponse;

			try {
				const { title, existingQuestions } = c.req.valid('json');
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
		},
	);
