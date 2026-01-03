import { z } from 'zod';
import { EMOJI_REACTIONS } from './types';

// ============ Validation Constants ============
export const LIMITS = {
	NICKNAME_MIN: 1,
	NICKNAME_MAX: 20,
	QUIZ_TITLE_MIN: 1,
	QUIZ_TITLE_MAX: 100,
	QUESTION_TEXT_MIN: 1,
	QUESTION_TEXT_MAX: 120,
	OPTION_TEXT_MIN: 1,
	OPTION_TEXT_MAX: 75,
	OPTIONS_MIN: 2,
	OPTIONS_MAX: 4,
	QUESTIONS_MIN: 1,
	QUESTIONS_MAX: 20,
	AI_PROMPT_MIN: 3,
	AI_PROMPT_MAX: 300,
	AI_NUM_QUESTIONS_MIN: 1,
	AI_NUM_QUESTIONS_MAX: 10,
	AI_IMAGE_PROMPT_MIN: 1,
	AI_IMAGE_PROMPT_MAX: 100,
	MAX_QUIZZES_PER_USER: 40,
} as const;

// ============ Base Schemas ============

/**
 * Player nickname validation
 */
export const nicknameSchema = z
	.string()
	.trim()
	.min(LIMITS.NICKNAME_MIN, 'Nickname is required')
	.max(LIMITS.NICKNAME_MAX, `Nickname must be at most ${LIMITS.NICKNAME_MAX} characters`)
	.regex(/^[a-zA-Z0-9\s_-]+$/, 'Nickname can only contain letters, numbers, spaces, underscores and hyphens');

/**
 * Quiz title validation
 */
const quizTitleSchema = z
	.string()
	.trim()
	.min(LIMITS.QUIZ_TITLE_MIN, 'Quiz title is required')
	.max(LIMITS.QUIZ_TITLE_MAX, `Quiz title must be at most ${LIMITS.QUIZ_TITLE_MAX} characters`);

/**
 * Question text validation
 */
const questionTextSchema = z
	.string()
	.trim()
	.min(LIMITS.QUESTION_TEXT_MIN, 'Question text is required')
	.max(LIMITS.QUESTION_TEXT_MAX, `Question must be at most ${LIMITS.QUESTION_TEXT_MAX} characters`);

/**
 * Option text validation
 */
const optionTextSchema = z
	.string()
	.trim()
	.min(LIMITS.OPTION_TEXT_MIN, 'Option text is required')
	.max(LIMITS.OPTION_TEXT_MAX, `Option must be at most ${LIMITS.OPTION_TEXT_MAX} characters`);

/**
 * AI prompt validation
 */
export const aiPromptSchema = z
	.string()
	.trim()
	.min(LIMITS.AI_PROMPT_MIN, `Prompt must be at least ${LIMITS.AI_PROMPT_MIN} characters`)
	.max(LIMITS.AI_PROMPT_MAX, `Prompt must be at most ${LIMITS.AI_PROMPT_MAX} characters`);

/**
 * AI image prompt validation
 */
export const imagePromptSchema = z
	.string()
	.trim()
	.min(LIMITS.AI_IMAGE_PROMPT_MIN, 'Prompt is required')
	.max(LIMITS.AI_IMAGE_PROMPT_MAX, `Prompt must be at most ${LIMITS.AI_IMAGE_PROMPT_MAX} characters`);

/**
 * Number of questions for AI generation
 */
const aiNumberQuestionsSchema = z
	.number()
	.int()
	.min(LIMITS.AI_NUM_QUESTIONS_MIN, `Must generate at least ${LIMITS.AI_NUM_QUESTIONS_MIN} question`)
	.max(LIMITS.AI_NUM_QUESTIONS_MAX, `Cannot generate more than ${LIMITS.AI_NUM_QUESTIONS_MAX} questions`);

// ============ Composite Schemas ============

/**
 * Single question schema (used in quiz editor form)
 */
const questionSchema = z.object({
	text: questionTextSchema,
	options: z
		.array(optionTextSchema)
		.min(LIMITS.OPTIONS_MIN, `A question must have at least ${LIMITS.OPTIONS_MIN} options`)
		.max(LIMITS.OPTIONS_MAX, `A question can have at most ${LIMITS.OPTIONS_MAX} options`),
	correctAnswerIndex: z.number().int().min(0),
	isDoublePoints: z.boolean().optional(),
	backgroundImage: z.string().optional(),
});

/**
 * Question schema for form input (correctAnswerIndex as string for radio buttons)
 */
const questionFormSchema = z.object({
	text: questionTextSchema,
	options: z
		.array(optionTextSchema)
		.min(LIMITS.OPTIONS_MIN, `A question must have at least ${LIMITS.OPTIONS_MIN} options`)
		.max(LIMITS.OPTIONS_MAX, `A question can have at most ${LIMITS.OPTIONS_MAX} options`),
	correctAnswerIndex: z.string().min(1, 'A correct answer must be selected'),
	isDoublePoints: z.boolean().optional(),
	backgroundImage: z.string().optional(),
});

/**
 * Full quiz schema (for API/storage)
 */
export const quizSchema = z.object({
	id: z.string().optional(),
	title: quizTitleSchema,
	questions: z
		.array(questionSchema)
		.min(LIMITS.QUESTIONS_MIN, `A quiz must have at least ${LIMITS.QUESTIONS_MIN} question`)
		.max(LIMITS.QUESTIONS_MAX, `A quiz can have at most ${LIMITS.QUESTIONS_MAX} questions`),
});

/**
 * Quiz form schema (for quiz editor)
 */
export const quizFormSchema = z.object({
	title: quizTitleSchema,
	questions: z
		.array(questionFormSchema)
		.min(LIMITS.QUESTIONS_MIN, `A quiz must have at least ${LIMITS.QUESTIONS_MIN} question`)
		.max(LIMITS.QUESTIONS_MAX, `A quiz can have at most ${LIMITS.QUESTIONS_MAX} questions`),
});

/**
 * AI quiz generation request schema
 */
export const aiGenerateRequestSchema = z.object({
	prompt: aiPromptSchema,
	numQuestions: aiNumberQuestionsSchema.optional().default(5),
});

/**
 * Create game request schema
 */
export const createGameRequestSchema = z.object({
	quizId: z.string().optional(),
});

// ============ WebSocket Message Schemas ============

const wsConnectHostSchema = z.object({
	type: z.literal('connect'),
	role: z.literal('host'),
	gameId: z.string().min(1),
	hostSecret: z.uuid(),
});

const wsConnectPlayerSchema = z.object({
	type: z.literal('connect'),
	role: z.literal('player'),
	gameId: z.string().min(1),
	playerId: z.uuid().optional(),
	playerToken: z.uuid().optional(),
	nickname: nicknameSchema.optional(),
});

// Use union for connect messages since they share the same 'type' discriminator
// The 'role' field differentiates between host and player
const wsConnectSchema = z.union([wsConnectHostSchema, wsConnectPlayerSchema]);

const wsJoinSchema = z.object({
	type: z.literal('join'),
	nickname: nicknameSchema,
});

const wsSubmitAnswerSchema = z.object({
	type: z.literal('submitAnswer'),
	answerIndex: z
		.number()
		.int()
		.min(0)
		.max(LIMITS.OPTIONS_MAX - 1),
});

const wsStartGameSchema = z.object({ type: z.literal('startGame') });
const wsNextStateSchema = z.object({ type: z.literal('nextState') });

const wsSendEmojiSchema = z.object({
	type: z.literal('sendEmoji'),
	emoji: z.enum(EMOJI_REACTIONS),
});

// Use union for all messages - discriminatedUnion doesn't support duplicate discriminator values
export const wsClientMessageSchema = z.union([
	wsConnectSchema,
	wsJoinSchema,
	wsStartGameSchema,
	wsSubmitAnswerSchema,
	wsNextStateSchema,
	wsSendEmojiSchema,
]);

// ============ Type Exports ============

export type QuizFormInput = z.input<typeof quizFormSchema>;
