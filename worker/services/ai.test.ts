import { generateQuizFromPrompt, generateSingleQuestion } from './ai';

const { run, close } = vi.hoisted(() => ({ run: vi.fn(), close: vi.fn() }));

vi.mock('cloudflare:workers', () => ({
	env: { AI: { run }, WORKERS_AI_MODEL: '@cf/meta/llama-3.1-8b-instruct' },
	waitUntil: vi.fn(),
}));

vi.mock('@ai-sdk/mcp', () => ({
	createMCPClient: vi.fn(async () => ({ tools: async () => ({}), close })),
}));

const question = {
	text: 'Which planet is fourth from the Sun?',
	options: ['Earth', 'Mars', 'Venus', 'Jupiter'],
	correctAnswerIndex: 1,
};

describe('AI SDK 7 quiz generation', () => {
	beforeEach(() => vi.clearAllMocks());

	it('generates structured questions through createAI with gateway metadata and system instructions', async () => {
		run.mockResolvedValueOnce(Response.json({ response: JSON.stringify(question) }));

		await expect(generateSingleQuestion('Space', [], undefined, { game_id: 'game-1' })).resolves.toMatchObject(question);

		expect(run).toHaveBeenCalledWith(
			'@cf/meta/llama-3.1-8b-instruct',
			expect.objectContaining({
				messages: expect.arrayContaining([
					expect.objectContaining({ role: 'system', content: expect.stringContaining('You are a quiz question generator') }),
					expect.objectContaining({ role: 'user', content: expect.stringContaining('Space') }),
				]),
			}),
			expect.objectContaining({ gateway: expect.objectContaining({ id: 'default', metadata: { game_id: 'game-1' } }) }),
		);
	});

	it('runs research and returns a structured quiz without system messages in the SDK prompt array', async () => {
		const quiz = { title: 'Space', questions: [question, question, question] };
		run
			.mockResolvedValueOnce(Response.json({ response: 'Mars is the fourth planet from the Sun.' }))
			.mockResolvedValueOnce(Response.json({ response: JSON.stringify(quiz) }));

		const result = await generateQuizFromPrompt('Space', 3, new AbortController().signal);

		expect(result.title).toBe('Space');
		expect(result.questions).toHaveLength(3);
		expect(result.questions.filter((item) => item.isDoublePoints)).toHaveLength(1);
		expect(run).toHaveBeenCalledTimes(2);
		expect(close).toHaveBeenCalled();
	});
});
