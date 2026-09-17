import { generateQuizFromPrompt } from './ai';
import { deleteGeneratedBackgroundImage, generateAndStoreBackgroundImage } from './image-generation';

import type { GeneratedQuestion, GeneratedQuiz, OnStatusUpdate } from './ai';

export type GeneratedMagicQuiz = Omit<GeneratedQuiz, 'questions'> & {
	questions: Array<GeneratedQuestion & { backgroundImage?: string }>;
};

interface MagicQuizDependencies {
	generateQuiz: typeof generateQuizFromPrompt;
	generateBackground: typeof generateAndStoreBackgroundImage;
	deleteBackground: typeof deleteGeneratedBackgroundImage;
}

const defaultDependencies: MagicQuizDependencies = {
	generateQuiz: generateQuizFromPrompt,
	generateBackground: generateAndStoreBackgroundImage,
	deleteBackground: deleteGeneratedBackgroundImage,
};

function getErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

async function withStageTiming<Result>(stage: string, operation: () => Promise<Result>): Promise<Result> {
	const startedAt = performance.now();

	try {
		const result = await operation();
		console.info({
			event: 'magic_quiz_stage',
			stage,
			outcome: 'success',
			durationMs: Math.round(performance.now() - startedAt),
		});
		return result;
	} catch (error) {
		console.warn({
			event: 'magic_quiz_stage',
			stage,
			outcome: 'error',
			durationMs: Math.round(performance.now() - startedAt),
			error: getErrorMessage(error),
		});
		throw error;
	}
}

export async function generateMagicQuizFromPrompt(
	prompt: string,
	numberQuestions: number,
	userId: string,
	abortSignal: AbortSignal,
	onStatusUpdate?: OnStatusUpdate,
	metadata?: Record<string, string>,
	dependencies: MagicQuizDependencies = defaultDependencies,
): Promise<GeneratedMagicQuiz> {
	const backgroundPromise = withStageTiming('background', () => dependencies.generateBackground(prompt, userId));
	const quizPromise = withStageTiming('quiz', () =>
		dependencies.generateQuiz(prompt, numberQuestions, abortSignal, onStatusUpdate, metadata),
	);
	const [quizResult, backgroundResult] = await Promise.allSettled([quizPromise, backgroundPromise]);

	if (quizResult.status === 'rejected') {
		if (backgroundResult.status === 'fulfilled') {
			try {
				await dependencies.deleteBackground(userId, backgroundResult.value.id);
			} catch (error) {
				console.error('[Magic Quiz Background Cleanup Error]', {
					imageId: backgroundResult.value.id,
					error: getErrorMessage(error),
				});
			}
		}

		throw quizResult.reason;
	}

	if (backgroundResult.status === 'rejected') {
		console.warn('[Magic Quiz Background Generation Failed]', {
			error: getErrorMessage(backgroundResult.reason),
		});
		return quizResult.value;
	}

	return {
		...quizResult.value,
		questions: quizResult.value.questions.map((question) => ({
			...question,
			backgroundImage: backgroundResult.value.path,
		})),
	};
}
