import { describe, expect, it } from 'vitest';

import {
	LIMITS,
	nicknameSchema,
	aiPromptSchema,
	imagePromptSchema,
	quizSchema,
	quizFormSchema,
	aiGenerateRequestSchema,
	createGameRequestSchema,
	wsClientMessageSchema,
} from './validation';

describe('validation.ts', () => {
	describe('LIMITS', () => {
		it('has all required limit constants', () => {
			expect(LIMITS.NICKNAME_MIN).toBeDefined();
			expect(LIMITS.NICKNAME_MAX).toBeDefined();
			expect(LIMITS.QUIZ_TITLE_MIN).toBeDefined();
			expect(LIMITS.QUIZ_TITLE_MAX).toBeDefined();
			expect(LIMITS.QUESTION_TEXT_MIN).toBeDefined();
			expect(LIMITS.QUESTION_TEXT_MAX).toBeDefined();
			expect(LIMITS.OPTION_TEXT_MIN).toBeDefined();
			expect(LIMITS.OPTION_TEXT_MAX).toBeDefined();
			expect(LIMITS.OPTIONS_MIN).toBeDefined();
			expect(LIMITS.OPTIONS_MAX).toBeDefined();
			expect(LIMITS.QUESTIONS_MIN).toBeDefined();
			expect(LIMITS.QUESTIONS_MAX).toBeDefined();
		});

		it('has sensible limit values', () => {
			expect(LIMITS.NICKNAME_MIN).toBeGreaterThan(0);
			expect(LIMITS.NICKNAME_MAX).toBeGreaterThan(LIMITS.NICKNAME_MIN);
			expect(LIMITS.OPTIONS_MIN).toBeGreaterThanOrEqual(2);
			expect(LIMITS.OPTIONS_MAX).toBeGreaterThanOrEqual(LIMITS.OPTIONS_MIN);
			expect(LIMITS.QUESTIONS_MIN).toBeGreaterThan(0);
			expect(LIMITS.QUESTIONS_MAX).toBeGreaterThan(LIMITS.QUESTIONS_MIN);
		});
	});

	describe('nicknameSchema', () => {
		it('accepts valid nicknames', () => {
			expect(nicknameSchema.safeParse('Player1').success).toBe(true);
			expect(nicknameSchema.safeParse('Cool_Name').success).toBe(true);
			expect(nicknameSchema.safeParse('Test-User').success).toBe(true);
			expect(nicknameSchema.safeParse('John Doe').success).toBe(true);
		});

		it('rejects empty nicknames', () => {
			expect(nicknameSchema.safeParse('').success).toBe(false);
			expect(nicknameSchema.safeParse('   ').success).toBe(false);
		});

		it('rejects nicknames that are too long', () => {
			const longNickname = 'a'.repeat(LIMITS.NICKNAME_MAX + 1);
			expect(nicknameSchema.safeParse(longNickname).success).toBe(false);
		});

		it('rejects nicknames with special characters', () => {
			expect(nicknameSchema.safeParse('Player@1').success).toBe(false);
			expect(nicknameSchema.safeParse('Test!User').success).toBe(false);
			expect(nicknameSchema.safeParse('Name#123').success).toBe(false);
		});

		it('trims whitespace', () => {
			const result = nicknameSchema.safeParse('  Player1  ');
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toBe('Player1');
			}
		});
	});

	describe('aiPromptSchema', () => {
		it('accepts valid prompts', () => {
			expect(aiPromptSchema.safeParse('Create a quiz about history').success).toBe(true);
		});

		it('rejects prompts that are too short', () => {
			expect(aiPromptSchema.safeParse('Hi').success).toBe(false);
		});

		it('rejects prompts that are too long', () => {
			const longPrompt = 'a'.repeat(LIMITS.AI_PROMPT_MAX + 1);
			expect(aiPromptSchema.safeParse(longPrompt).success).toBe(false);
		});
	});

	describe('imagePromptSchema', () => {
		it('accepts valid image prompts', () => {
			expect(imagePromptSchema.safeParse('A beautiful sunset').success).toBe(true);
		});

		it('rejects empty prompts', () => {
			expect(imagePromptSchema.safeParse('').success).toBe(false);
		});

		it('rejects prompts that are too long', () => {
			const longPrompt = 'a'.repeat(LIMITS.AI_IMAGE_PROMPT_MAX + 1);
			expect(imagePromptSchema.safeParse(longPrompt).success).toBe(false);
		});
	});

	describe('quizSchema', () => {
		const validQuiz = {
			title: 'Test Quiz',
			questions: [
				{
					text: 'What is 2+2?',
					options: ['1', '2', '3', '4'],
					correctAnswerIndex: 3,
				},
			],
		};

		it('accepts valid quiz', () => {
			expect(quizSchema.safeParse(validQuiz).success).toBe(true);
		});

		it('accepts quiz with optional id', () => {
			expect(quizSchema.safeParse({ ...validQuiz, id: 'quiz-123' }).success).toBe(true);
		});

		it('rejects quiz without title', () => {
			const { title: _, ...quizWithoutTitle } = validQuiz;
			expect(quizSchema.safeParse(quizWithoutTitle).success).toBe(false);
		});

		it('rejects quiz without questions', () => {
			const { questions: _, ...quizWithoutQuestions } = validQuiz;
			expect(quizSchema.safeParse(quizWithoutQuestions).success).toBe(false);
		});

		it('rejects quiz with empty questions array', () => {
			expect(quizSchema.safeParse({ ...validQuiz, questions: [] }).success).toBe(false);
		});

		it('rejects question with less than 2 options', () => {
			const invalidQuiz = {
				...validQuiz,
				questions: [
					{
						text: 'Question?',
						options: ['Only one'],
						correctAnswerIndex: 0,
					},
				],
			};
			expect(quizSchema.safeParse(invalidQuiz).success).toBe(false);
		});

		it('accepts question with isDoublePoints', () => {
			const doublePointsQuiz = {
				...validQuiz,
				questions: [
					{
						...validQuiz.questions[0],
						isDoublePoints: true,
					},
				],
			};
			expect(quizSchema.safeParse(doublePointsQuiz).success).toBe(true);
		});

		it('accepts question with backgroundImage', () => {
			const imageQuiz = {
				...validQuiz,
				questions: [
					{
						...validQuiz.questions[0],
						backgroundImage: 'https://example.com/image.jpg',
					},
				],
			};
			expect(quizSchema.safeParse(imageQuiz).success).toBe(true);
		});
	});

	describe('quizFormSchema', () => {
		const validFormQuiz = {
			title: 'Test Quiz',
			questions: [
				{
					text: 'What is 2+2?',
					options: [{ value: '1' }, { value: '2' }, { value: '3' }, { value: '4' }],
					correctAnswerIndex: '3',
				},
			],
		};

		it('accepts valid form quiz', () => {
			expect(quizFormSchema.safeParse(validFormQuiz).success).toBe(true);
		});

		it('requires correctAnswerIndex to be a non-empty string', () => {
			const invalidQuiz = {
				...validFormQuiz,
				questions: [
					{
						...validFormQuiz.questions[0],
						correctAnswerIndex: '',
					},
				],
			};
			expect(quizFormSchema.safeParse(invalidQuiz).success).toBe(false);
		});

		it('requires options to be objects with value property', () => {
			const invalidQuiz = {
				...validFormQuiz,
				questions: [
					{
						text: 'Question?',
						options: ['A', 'B'], // Plain strings instead of objects
						correctAnswerIndex: '0',
					},
				],
			};
			expect(quizFormSchema.safeParse(invalidQuiz).success).toBe(false);
		});
	});

	describe('aiGenerateRequestSchema', () => {
		it('accepts valid request with prompt only', () => {
			const result = aiGenerateRequestSchema.safeParse({ prompt: 'Create quiz about cats' });
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.numQuestions).toBe(5); // default value
			}
		});

		it('accepts valid request with numQuestions', () => {
			const result = aiGenerateRequestSchema.safeParse({
				prompt: 'Create quiz about dogs',
				numQuestions: 10,
			});
			expect(result.success).toBe(true);
		});

		it('rejects request without prompt', () => {
			expect(aiGenerateRequestSchema.safeParse({}).success).toBe(false);
		});

		it('rejects numQuestions below minimum', () => {
			expect(
				aiGenerateRequestSchema.safeParse({
					prompt: 'Test prompt',
					numQuestions: 0,
				}).success,
			).toBe(false);
		});

		it('rejects numQuestions above maximum', () => {
			expect(
				aiGenerateRequestSchema.safeParse({
					prompt: 'Test prompt',
					numQuestions: LIMITS.AI_NUM_QUESTIONS_MAX + 1,
				}).success,
			).toBe(false);
		});
	});

	describe('createGameRequestSchema', () => {
		it('accepts request without quizId', () => {
			expect(createGameRequestSchema.safeParse({}).success).toBe(true);
		});

		it('accepts request with quizId', () => {
			expect(createGameRequestSchema.safeParse({ quizId: 'quiz-123' }).success).toBe(true);
		});
	});

	describe('wsClientMessageSchema', () => {
		describe('connect messages', () => {
			it('accepts valid host connect message', () => {
				const result = wsClientMessageSchema.safeParse({
					type: 'connect',
					role: 'host',
					gameId: 'test-game',
					hostSecret: '550e8400-e29b-41d4-a716-446655440000',
				});
				expect(result.success).toBe(true);
			});

			it('accepts valid player connect message', () => {
				const result = wsClientMessageSchema.safeParse({
					type: 'connect',
					role: 'player',
					gameId: 'test-game',
				});
				expect(result.success).toBe(true);
			});

			it('accepts player connect with playerId and token', () => {
				const result = wsClientMessageSchema.safeParse({
					type: 'connect',
					role: 'player',
					gameId: 'test-game',
					playerId: '550e8400-e29b-41d4-a716-446655440000',
					playerToken: '550e8400-e29b-41d4-a716-446655440001',
				});
				expect(result.success).toBe(true);
			});

			it('rejects connect without gameId', () => {
				const result = wsClientMessageSchema.safeParse({
					type: 'connect',
					role: 'player',
				});
				expect(result.success).toBe(false);
			});
		});

		describe('join message', () => {
			it('accepts valid join message', () => {
				const result = wsClientMessageSchema.safeParse({
					type: 'join',
					nickname: 'Player1',
				});
				expect(result.success).toBe(true);
			});

			it('rejects join with invalid nickname', () => {
				const result = wsClientMessageSchema.safeParse({
					type: 'join',
					nickname: '',
				});
				expect(result.success).toBe(false);
			});
		});

		describe('submitAnswer message', () => {
			it('accepts valid submitAnswer message', () => {
				const result = wsClientMessageSchema.safeParse({
					type: 'submitAnswer',
					answerIndex: 0,
				});
				expect(result.success).toBe(true);
			});

			it('rejects negative answerIndex', () => {
				const result = wsClientMessageSchema.safeParse({
					type: 'submitAnswer',
					answerIndex: -1,
				});
				expect(result.success).toBe(false);
			});

			it('rejects answerIndex above maximum options', () => {
				const result = wsClientMessageSchema.safeParse({
					type: 'submitAnswer',
					answerIndex: LIMITS.OPTIONS_MAX,
				});
				expect(result.success).toBe(false);
			});
		});

		describe('startGame message', () => {
			it('accepts valid startGame message', () => {
				const result = wsClientMessageSchema.safeParse({ type: 'startGame' });
				expect(result.success).toBe(true);
			});
		});

		describe('nextState message', () => {
			it('accepts valid nextState message', () => {
				const result = wsClientMessageSchema.safeParse({ type: 'nextState' });
				expect(result.success).toBe(true);
			});
		});

		describe('sendEmoji message', () => {
			it('accepts valid sendEmoji message', () => {
				const result = wsClientMessageSchema.safeParse({
					type: 'sendEmoji',
					emoji: '❤️',
				});
				expect(result.success).toBe(true);
			});

			it('rejects invalid emoji', () => {
				const result = wsClientMessageSchema.safeParse({
					type: 'sendEmoji',
					emoji: '🦄', // Not in EMOJI_REACTIONS
				});
				expect(result.success).toBe(false);
			});
		});
	});
});
