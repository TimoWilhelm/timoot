import { describe, expect, it } from 'vitest';

import { containsProfanity } from './profanity';

describe('profanity.ts', () => {
	describe('containsProfanity', () => {
		it('returns true for profane text', () => {
			expect(containsProfanity('fuck')).toBe(true);
		});

		it('returns false for clean text', () => {
			expect(containsProfanity('Player1')).toBe(false);
		});
	});
});
