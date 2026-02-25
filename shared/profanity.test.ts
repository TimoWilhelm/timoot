import { describe, expect, it } from 'vitest';

import { containsProfanity } from './profanity';

describe('profanity.ts', () => {
	describe('containsProfanity', () => {
		it('returns false for clean nicknames', () => {
			expect(containsProfanity('Player1')).toBe(false);
			expect(containsProfanity('Cool_Name')).toBe(false);
			expect(containsProfanity('Test-User')).toBe(false);
			expect(containsProfanity('John Doe')).toBe(false);
			expect(containsProfanity('GameMaster')).toBe(false);
			expect(containsProfanity('QuizKing')).toBe(false);
		});

		it('detects obvious profanity', () => {
			expect(containsProfanity('fuck')).toBe(true);
			expect(containsProfanity('shit')).toBe(true);
			expect(containsProfanity('ass')).toBe(true);
		});

		it('detects profanity embedded in text', () => {
			expect(containsProfanity('nicefuckname')).toBe(true);
			expect(containsProfanity('theshitman')).toBe(true);
		});

		it('avoids common false positives', () => {
			expect(containsProfanity('class')).toBe(false);
			expect(containsProfanity('assume')).toBe(false);
			expect(containsProfanity('pass')).toBe(false);
			expect(containsProfanity('grass')).toBe(false);
			expect(containsProfanity('classic')).toBe(false);
			expect(containsProfanity('bass')).toBe(false);
		});
	});
});
