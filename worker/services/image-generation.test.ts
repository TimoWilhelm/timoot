import { buildBackgroundImagePrompt } from './image-generation';

describe('buildBackgroundImagePrompt', () => {
	it('makes the quiz topic the primary image instruction', () => {
		const prompt = buildBackgroundImagePrompt('Ancient Egyptian mythology');

		expect(prompt).toMatch(
			/^Create a wide panoramic, edge-to-edge digital illustration\. Visually express this exact subject using imagery only: Ancient Egyptian mythology\./,
		);
		expect(prompt).not.toContain('quiz background');
		expect(prompt).not.toContain('"Ancient Egyptian mythology"');
		expect(prompt).toContain('Topic accuracy and relevance are the highest priority');
		expect(prompt).toContain('objects, artifacts, symbols, environments, architecture, landscapes, scientific imagery');
		expect(prompt).toContain('Do not include people or characters');
		expect(prompt).toContain('completely typography-free: zero words, letters, numbers, captions, labels');
		expect(prompt).not.toContain('scenery only');
	});
});
