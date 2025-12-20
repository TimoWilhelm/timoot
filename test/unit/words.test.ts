import { describe, it, expect } from 'vitest';
import { generateGameId, adjectives, colors, animals } from '../../worker/words';

describe('words.ts', () => {
	describe('generateGameId', () => {
		it('returns a string in lowercase adjective-color-animal format', () => {
			const id = generateGameId();
			const parts = id.split('-');

			expect(parts).toHaveLength(3);
			expect(id).toBe(id.toLowerCase());
		});

		it('uses words from the predefined lists', () => {
			const id = generateGameId();
			const [adj, color, animal] = id.split('-');

			const lowercaseAdjectives = adjectives.map((a) => a.toLowerCase());
			const lowercaseColors = colors.map((c) => c.toLowerCase());
			const lowercaseAnimals = animals.map((a) => a.toLowerCase());

			expect(lowercaseAdjectives).toContain(adj);
			expect(lowercaseColors).toContain(color);
			expect(lowercaseAnimals).toContain(animal);
		});

		it('generates different IDs on multiple calls (randomness)', () => {
			const ids = new Set<string>();
			// Generate 100 IDs and check we get at least a few unique ones
			for (let i = 0; i < 100; i++) {
				ids.add(generateGameId());
			}
			// With 41 adjectives, 31 colors, 41 animals = 51,911 combinations
			// 100 tries should yield many unique IDs
			expect(ids.size).toBeGreaterThan(50);
		});
	});

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
});
