import { describe, expect, it } from 'vitest';

import {
	adjectives,
	colors,
	animals,
	isValidWord,
	findMatches,
	isValidGameId,
	getWordListForPosition,
	generateRandomPlaceholder,
} from './words';

describe('words.ts', () => {
	describe('word lists', () => {
		it('adjectives list is non-empty', () => {
			expect(adjectives.length).toBeGreaterThan(0);
		});

		it('colors list is non-empty', () => {
			expect(colors.length).toBeGreaterThan(0);
		});

		it('animals list is non-empty', () => {
			expect(animals.length).toBeGreaterThan(0);
		});

		it('all adjectives are title-cased strings', () => {
			for (const adj of adjectives) {
				expect(typeof adj).toBe('string');
				expect(adj.length).toBeGreaterThan(0);
				expect(adj[0]).toBe(adj[0].toUpperCase());
			}
		});

		it('all colors are title-cased strings', () => {
			for (const color of colors) {
				expect(typeof color).toBe('string');
				expect(color.length).toBeGreaterThan(0);
				expect(color[0]).toBe(color[0].toUpperCase());
			}
		});

		it('all animals are title-cased strings', () => {
			for (const animal of animals) {
				expect(typeof animal).toBe('string');
				expect(animal.length).toBeGreaterThan(0);
				expect(animal[0]).toBe(animal[0].toUpperCase());
			}
		});
	});

	describe('isValidWord', () => {
		it('returns true for valid adjectives (case-insensitive)', () => {
			expect(isValidWord('Happy', adjectives)).toBe(true);
			expect(isValidWord('happy', adjectives)).toBe(true);
			expect(isValidWord('HAPPY', adjectives)).toBe(true);
		});

		it('returns true for valid colors (case-insensitive)', () => {
			expect(isValidWord('Red', colors)).toBe(true);
			expect(isValidWord('red', colors)).toBe(true);
			expect(isValidWord('RED', colors)).toBe(true);
		});

		it('returns true for valid animals (case-insensitive)', () => {
			expect(isValidWord('Lion', animals)).toBe(true);
			expect(isValidWord('lion', animals)).toBe(true);
			expect(isValidWord('LION', animals)).toBe(true);
		});

		it('returns false for invalid words', () => {
			expect(isValidWord('NotAWord', adjectives)).toBe(false);
			expect(isValidWord('InvalidColor', colors)).toBe(false);
			expect(isValidWord('FakeAnimal', animals)).toBe(false);
		});

		it('returns false for empty string', () => {
			expect(isValidWord('', adjectives)).toBe(false);
		});
	});

	describe('findMatches', () => {
		it('returns all items when input is empty', () => {
			expect(findMatches('', adjectives)).toEqual(adjectives);
		});

		it('returns matching items for partial input', () => {
			const matches = findMatches('Ha', adjectives);
			expect(matches.length).toBeGreaterThan(0);
			for (const match of matches) {
				expect(match.toLowerCase().startsWith('ha')).toBe(true);
			}
		});

		it('is case-insensitive', () => {
			const matchesLower = findMatches('ha', adjectives);
			const matchesUpper = findMatches('HA', adjectives);
			expect(matchesLower).toEqual(matchesUpper);
		});

		it('returns empty array when no matches', () => {
			const matches = findMatches('xyz', adjectives);
			expect(matches).toEqual([]);
		});

		it('works with colors', () => {
			const matches = findMatches('Re', colors);
			expect(matches).toContain('Red');
		});

		it('works with animals', () => {
			const matches = findMatches('Li', animals);
			expect(matches).toContain('Lion');
		});
	});

	describe('isValidGameId', () => {
		it('returns true for valid game ID format', () => {
			expect(isValidGameId('happy-red-lion')).toBe(true);
		});

		it('is case-insensitive', () => {
			expect(isValidGameId('Happy-Red-Lion')).toBe(true);
			expect(isValidGameId('HAPPY-RED-LION')).toBe(true);
		});

		it('returns false for invalid adjective', () => {
			expect(isValidGameId('invalid-red-lion')).toBe(false);
		});

		it('returns false for invalid color', () => {
			expect(isValidGameId('happy-invalid-lion')).toBe(false);
		});

		it('returns false for invalid animal', () => {
			expect(isValidGameId('happy-red-invalid')).toBe(false);
		});

		it('returns false for wrong number of parts', () => {
			expect(isValidGameId('happy-red')).toBe(false);
			expect(isValidGameId('happy')).toBe(false);
			expect(isValidGameId('happy-red-lion-extra')).toBe(false);
		});

		it('returns false for empty string', () => {
			expect(isValidGameId('')).toBe(false);
		});
	});

	describe('getWordListForPosition', () => {
		it('returns adjective info for first position', () => {
			const result = getWordListForPosition(['happy']);
			expect(result?.label).toBe('Adjective');
			expect(result?.list).toBe(adjectives);
		});

		it('returns color info for second position', () => {
			const result = getWordListForPosition(['happy', 'red']);
			expect(result?.label).toBe('Color');
			expect(result?.list).toBe(colors);
		});

		it('returns animal info for third position', () => {
			const result = getWordListForPosition(['happy', 'red', 'lion']);
			expect(result?.label).toBe('Animal');
			expect(result?.list).toBe(animals);
		});

		it('returns undefined for more than 3 parts', () => {
			const result = getWordListForPosition(['a', 'b', 'c', 'd']);
			expect(result).toBeUndefined();
		});

		it('returns undefined for empty array', () => {
			const result = getWordListForPosition([]);
			expect(result).toBeUndefined();
		});
	});

	describe('generateRandomPlaceholder', () => {
		it('generates a string in correct format', () => {
			const placeholder = generateRandomPlaceholder();
			const parts = placeholder.split('-');
			expect(parts.length).toBe(3);
		});

		it('generates lowercase placeholder', () => {
			const placeholder = generateRandomPlaceholder();
			expect(placeholder).toBe(placeholder.toLowerCase());
		});

		it('uses valid words from lists', () => {
			const placeholder = generateRandomPlaceholder();
			expect(isValidGameId(placeholder)).toBe(true);
		});

		it('generates different placeholders (randomness)', () => {
			const placeholders = new Set<string>();
			for (let index = 0; index < 50; index++) {
				placeholders.add(generateRandomPlaceholder());
			}
			// With high probability, should get multiple unique placeholders
			expect(placeholders.size).toBeGreaterThan(10);
		});
	});
});
