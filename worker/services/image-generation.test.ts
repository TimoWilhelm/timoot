import { buildBackgroundImagePrompt } from './image-generation';

describe('buildBackgroundImagePrompt', () => {
	it('makes the quiz topic the primary image instruction', () => {
		const prompt = buildBackgroundImagePrompt('Ancient Egyptian mythology');

		expect(prompt).toMatch(/^Create a wide panoramic quiz background about this exact topic: "Ancient Egyptian mythology"\./);
		expect(prompt).toContain('Topic accuracy and relevance are the highest priority');
		expect(prompt).toContain('objects, artifacts, symbols, environments, architecture, landscapes, scientific imagery');
		expect(prompt).toContain('Do not include people or characters');
		expect(prompt).not.toContain('scenery only');
	});
});
