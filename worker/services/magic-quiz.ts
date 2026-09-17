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

export async function generateMagicQuizFromPrompt(
	prompt: string,
	numberQuestions: number,
	userId: string,
	abortSignal: AbortSignal,
	onStatusUpdate?: OnStatusUpdate,
	metadata?: Record<string, string>,
	dependencies: MagicQuizDependencies = defaultDependencies,
): Promise<GeneratedMagicQuiz> {
	const backgroundPromise = dependencies.generateBackground(prompt, userId);
	const quizPromise = dependencies.generateQuiz(prompt, numberQuestions, abortSignal, onStatusUpdate, metadata);
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
