import type { GenerationStatus } from '@shared/types';

export function getMagicQuizStatusPhrases(prompt: string, status?: GenerationStatus): string[] {
	const topic = prompt.trim() || 'your topic';

	switch (status?.stage) {
		case 'researching': {
			return [`Researching ${topic}…`, `Understanding ${topic}, allegedly…`, `Grokking ${topic}…`];
		}
		case 'reading_docs': {
			return [
				'Consulting the sacred documentation…',
				'Interpreting documentation hieroglyphics…',
				'Checking whether the docs admit any edge cases…',
			];
		}
		case 'searching_web': {
			return [
				'Cross-examining Wikipedia…',
				'Separating facts from extremely confident vibes…',
				'Following citations like a responsible little robot…',
			];
		}
		case 'generating': {
			return [
				'Hallucinating questions—responsibly…',
				'Inventing suspiciously convincing wrong answers…',
				'Making one question needlessly spicy…',
				'Assigning double points with rigorous vibes…',
			];
		}
		default: {
			return ['Waking the quiz goblins…'];
		}
	}
}
