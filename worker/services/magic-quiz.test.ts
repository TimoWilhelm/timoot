import { generateMagicQuizFromPrompt } from './magic-quiz';

import type { GeneratedQuiz } from './ai';
import type { GeneratedBackgroundImage } from './image-generation';

const quiz: GeneratedQuiz = {
	title: 'Space Quiz',
	questions: [
		{ text: 'Question one', options: ['A', 'B', 'C', 'D'], correctAnswerIndex: 0 },
		{ text: 'Question two', options: ['A', 'B', 'C', 'D'], correctAnswerIndex: 1 },
		{ text: 'Question three', options: ['A', 'B', 'C', 'D'], correctAnswerIndex: 2 },
	],
};

const background: GeneratedBackgroundImage = {
	id: 'image-id',
	name: 'Space',
	path: '/api/images/user-id/image-id',
	prompt: 'Space',
	createdAt: '2026-09-16T00:00:00.000Z',
};

describe('generateMagicQuizFromPrompt', () => {
	it('generates the quiz and background concurrently and applies one image to every question', async () => {
		const quizDeferred = Promise.withResolvers<GeneratedQuiz>();
		const backgroundDeferred = Promise.withResolvers<GeneratedBackgroundImage>();
		const generateQuiz = vi.fn().mockReturnValue(quizDeferred.promise);
		const generateBackground = vi.fn().mockReturnValue(backgroundDeferred.promise);

		const resultPromise = generateMagicQuizFromPrompt('Space', 3, 'user-id', new AbortController().signal, undefined, undefined, {
			generateQuiz,
			generateBackground,
			deleteBackground: vi.fn(),
		});

		expect(generateQuiz).toHaveBeenCalledOnce();
		expect(generateBackground).toHaveBeenCalledOnce();
		quizDeferred.resolve(quiz);
		backgroundDeferred.resolve(background);

		const result = await resultPromise;
		expect(result.questions).toHaveLength(3);
		expect(result.questions.every((question) => question.backgroundImage === background.path)).toBe(true);
	});

	it('returns the quiz without a background when image generation fails', async () => {
		const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});

		const result = await generateMagicQuizFromPrompt('Space', 3, 'user-id', new AbortController().signal, undefined, undefined, {
			generateQuiz: vi.fn().mockResolvedValue(quiz),
			generateBackground: vi.fn().mockRejectedValue(new Error('image unavailable')),
			deleteBackground: vi.fn(),
		});

		expect(result).toBe(quiz);
		expect(warning).toHaveBeenCalledWith('[Magic Quiz Background Generation Failed]', {
			error: 'image unavailable',
		});
	});

	it('deletes a generated background when quiz generation fails', async () => {
		const deleteBackground = vi.fn().mockResolvedValue();

		await expect(
			generateMagicQuizFromPrompt('Space', 3, 'user-id', new AbortController().signal, undefined, undefined, {
				generateQuiz: vi.fn().mockRejectedValue(new Error('quiz unavailable')),
				generateBackground: vi.fn().mockResolvedValue(background),
				deleteBackground,
			}),
		).rejects.toThrow('quiz unavailable');
		expect(deleteBackground).toHaveBeenCalledWith('user-id', background.id);
	});
});
