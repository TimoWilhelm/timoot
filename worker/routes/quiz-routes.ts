import { zValidator } from '@hono/zod-validator';
import { env, exports, waitUntil } from 'cloudflare:workers';
import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { z } from 'zod';

import { LIMITS, aiGenerateRequestSchema, quizSchema } from '@shared/validation';

import { PREDEFINED_QUIZZES } from '../lib/quizzes';
import { checkRateLimit } from '../lib/utilities';
import { userIdHeaderSchema, protectedHeaderSchema, getUserId, verifyTurnstile } from '../lib/validators';
import { type GeneratedQuestion, generateQuizFromPrompt, generateSingleQuestion } from '../services/ai';

import type { ApiResponse, GenerationStatus, Quiz, QuizGenerateSSEEvent } from '@shared/types';

/**
 * Quiz routes with RPC-compatible chained methods.
 * Routes are chained to enable type inference for the Hono client.
 */
export const quizRoutes = new Hono<{ Bindings: never }>()
	// Get predefined quizzes (no auth required)
	.get('/api/quizzes', (c) => {
		return c.json({ success: true, data: PREDEFINED_QUIZZES } satisfies ApiResponse<Quiz[]>, 200, {
			'Cache-Control': 'public, max-age=3600',
		});
	})

	// Get custom quizzes for user
	.get('/api/quizzes/custom', zValidator('header', userIdHeaderSchema), async (c) => {
		const userId = getUserId(c);
		const quizStoreStub = exports.UserStoreDurableObject.getByName(`user:${userId}`);
		const data = await quizStoreStub.getCustomQuizzes();
		// Update last activity (non-blocking)
		waitUntil(quizStoreStub.touchLastAccess(userId));
		return c.json({ success: true, data } satisfies ApiResponse<Quiz[]>);
	})

	// Get specific custom quiz
	.get('/api/quizzes/custom/:id', zValidator('header', userIdHeaderSchema), async (c) => {
		const { id } = c.req.param();
		const userId = getUserId(c);
		const quizStoreStub = exports.UserStoreDurableObject.getByName(`user:${userId}`);
		const data = await quizStoreStub.getCustomQuizById(id);
		if (!data) {
			return c.json({ success: false, error: 'Quiz not found' }, 404);
		}
		return c.json({ success: true, data } satisfies ApiResponse<Quiz>);
	})

	// Create custom quiz
	.post('/api/quizzes/custom', zValidator('header', userIdHeaderSchema), zValidator('json', quizSchema), async (c) => {
		const quiz = c.req.valid('json');
		const userId = getUserId(c);
		const quizStoreStub = exports.UserStoreDurableObject.getByName(`user:${userId}`);
		const existingQuizzes = await quizStoreStub.getCustomQuizzes();
		if (existingQuizzes.length >= LIMITS.MAX_QUIZZES_PER_USER) {
			return c.json(
				{ success: false, error: `You have reached the limit of ${LIMITS.MAX_QUIZZES_PER_USER} quizzes.` } satisfies ApiResponse,
				400,
			);
		}
		const data = await quizStoreStub.saveCustomQuiz(quiz);
		// Update last activity (non-blocking)
		waitUntil(quizStoreStub.touchLastAccess(userId));
		return c.json({ success: true, data } satisfies ApiResponse<Quiz>, 201);
	})

	// Update custom quiz
	.put('/api/quizzes/custom/:id', zValidator('header', userIdHeaderSchema), zValidator('json', quizSchema), async (c) => {
		const { id } = c.req.param();
		const quiz = c.req.valid('json');
		if (id !== quiz.id) {
			return c.json({ success: false, error: 'ID mismatch' }, 400);
		}
		const userId = getUserId(c);
		const quizStoreStub = exports.UserStoreDurableObject.getByName(`user:${userId}`);
		const data = await quizStoreStub.saveCustomQuiz(quiz);
		// Update last activity (non-blocking)
		waitUntil(quizStoreStub.touchLastAccess(userId));
		return c.json({ success: true, data } satisfies ApiResponse<Quiz>);
	})

	// Delete custom quiz
	.delete('/api/quizzes/custom/:id', zValidator('header', userIdHeaderSchema), async (c) => {
		const { id } = c.req.param();
		const userId = getUserId(c);
		const quizStoreStub = exports.UserStoreDurableObject.getByName(`user:${userId}`);
		const data = await quizStoreStub.deleteCustomQuiz(id);
		if (!data.success) {
			return c.json({ success: false, error: 'Quiz not found' }, 404);
		}
		// Update last activity (non-blocking)
		waitUntil(quizStoreStub.touchLastAccess(userId));
		return c.json({ success: true });
	})

	// AI Quiz Generation endpoint with SSE streaming for status updates
	.post(
		'/api/quizzes/generate',
		zValidator('header', protectedHeaderSchema),
		verifyTurnstile,
		zValidator('json', aiGenerateRequestSchema),
		async (c) => {
			const rateLimitResponse = await checkRateLimit(c, env.AI_RATE_LIMITER, 'quiz-generate');
			if (rateLimitResponse) return rateLimitResponse;

			const { prompt, numQuestions } = c.req.valid('json');

			const userId = getUserId(c);
			const quizStoreStub = exports.UserStoreDurableObject.getByName(`user:${userId}`);
			const existingQuizzes = await quizStoreStub.getCustomQuizzes();

			if (existingQuizzes.length >= LIMITS.MAX_QUIZZES_PER_USER) {
				return c.json(
					{ success: false, error: `You have reached the limit of ${LIMITS.MAX_QUIZZES_PER_USER} quizzes.` } satisfies ApiResponse,
					400,
				);
			}

			const writeSSEEvent = (stream: Parameters<Parameters<typeof streamSSE>[1]>[0], event: QuizGenerateSSEEvent) => {
				return stream.writeSSE({ event: event.event, data: JSON.stringify(event.data) });
			};

			return streamSSE(c, async (stream) => {
				try {
					const onStatusUpdate = (status: GenerationStatus) => {
						void writeSSEEvent(stream, { event: 'status', data: status });
					};

					const generatedQuiz = await generateQuizFromPrompt(prompt, numQuestions, c.req.raw.signal, onStatusUpdate, {
						connecting_ip: c.req.header('CF-Connecting-IP') ?? 'unknown',
					});

					// Save the generated quiz as a custom quiz
					// Note: validation of limit was done before generation, but parallel requests could still race.
					// Since consistency isn't critical (just soft limit), this is fine.
					const savedQuiz = await quizStoreStub.saveCustomQuiz({
						title: generatedQuiz.title,
						questions: generatedQuiz.questions,
					});

					await writeSSEEvent(stream, { event: 'complete', data: { success: true, data: savedQuiz } });
				} catch (error) {
					console.error('[AI Quiz Generation Error]', error);
					await writeSSEEvent(stream, {
						event: 'error',
						data: { success: false, error: error instanceof Error ? error.message : 'Failed to generate quiz' },
					});
				}
			});
		},
	)

	// AI Single Question Generation endpoint
	.post(
		'/api/quizzes/generate-question',
		zValidator('header', userIdHeaderSchema),
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
			const rateLimitResponse = await checkRateLimit(c, env.AI_RATE_LIMITER, 'question-generate');
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
