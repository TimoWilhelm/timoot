import { describe, expect, it } from 'vitest';

import { phaseAllowsEmoji, isGamePhaseActive, phaseAllowsManualAdvance } from './phase-rules';

import type { GamePhase } from './types';

const ALL_PHASES: GamePhase[] = [
	'LOBBY',
	'GET_READY',
	'QUESTION_MODIFIER',
	'QUESTION',
	'REVEAL',
	'LEADERBOARD',
	'END_INTRO',
	'END_REVEALED',
];

describe('phase-rules.ts', () => {
	describe('phaseAllowsEmoji', () => {
		it('has rules for all game phases', () => {
			for (const phase of ALL_PHASES) {
				expect(phaseAllowsEmoji[phase]).toBeDefined();
				expect(typeof phaseAllowsEmoji[phase]).toBe('boolean');
			}
		});

		it('allows emoji in LOBBY', () => {
			expect(phaseAllowsEmoji.LOBBY).toBe(true);
		});

		it('allows emoji in GET_READY', () => {
			expect(phaseAllowsEmoji.GET_READY).toBe(true);
		});

		it('disallows emoji during QUESTION_MODIFIER', () => {
			expect(phaseAllowsEmoji.QUESTION_MODIFIER).toBe(false);
		});

		it('disallows emoji during QUESTION', () => {
			expect(phaseAllowsEmoji.QUESTION).toBe(false);
		});

		it('allows emoji in REVEAL', () => {
			expect(phaseAllowsEmoji.REVEAL).toBe(true);
		});

		it('allows emoji in LEADERBOARD', () => {
			expect(phaseAllowsEmoji.LEADERBOARD).toBe(true);
		});

		it('allows emoji in END phases', () => {
			expect(phaseAllowsEmoji.END_INTRO).toBe(true);
			expect(phaseAllowsEmoji.END_REVEALED).toBe(true);
		});
	});

	describe('isGamePhaseActive', () => {
		it('has rules for all game phases', () => {
			for (const phase of ALL_PHASES) {
				expect(isGamePhaseActive[phase]).toBeDefined();
				expect(typeof isGamePhaseActive[phase]).toBe('boolean');
			}
		});

		it('LOBBY is not active', () => {
			expect(isGamePhaseActive.LOBBY).toBe(false);
		});

		it('game phases during play are active', () => {
			expect(isGamePhaseActive.GET_READY).toBe(true);
			expect(isGamePhaseActive.QUESTION_MODIFIER).toBe(true);
			expect(isGamePhaseActive.QUESTION).toBe(true);
			expect(isGamePhaseActive.REVEAL).toBe(true);
			expect(isGamePhaseActive.LEADERBOARD).toBe(true);
		});

		it('END phases are not active', () => {
			expect(isGamePhaseActive.END_INTRO).toBe(false);
			expect(isGamePhaseActive.END_REVEALED).toBe(false);
		});
	});

	describe('phaseAllowsManualAdvance', () => {
		it('has rules for all game phases', () => {
			for (const phase of ALL_PHASES) {
				expect(phaseAllowsManualAdvance[phase]).toBeDefined();
				expect(typeof phaseAllowsManualAdvance[phase]).toBe('boolean');
			}
		});

		it('does not allow manual advance in LOBBY', () => {
			expect(phaseAllowsManualAdvance.LOBBY).toBe(false);
		});

		it('does not allow manual advance during automatic phases', () => {
			expect(phaseAllowsManualAdvance.GET_READY).toBe(false);
			expect(phaseAllowsManualAdvance.QUESTION_MODIFIER).toBe(false);
			expect(phaseAllowsManualAdvance.QUESTION).toBe(false);
		});

		it('allows manual advance in REVEAL and LEADERBOARD', () => {
			expect(phaseAllowsManualAdvance.REVEAL).toBe(true);
			expect(phaseAllowsManualAdvance.LEADERBOARD).toBe(true);
		});

		it('does not allow manual advance in END phases', () => {
			expect(phaseAllowsManualAdvance.END_INTRO).toBe(false);
			expect(phaseAllowsManualAdvance.END_REVEALED).toBe(false);
		});
	});

	describe('phase rule consistency', () => {
		it('phases that allow manual advance should allow emoji', () => {
			// If you can manually advance, the game is paused and emojis make sense
			for (const phase of ALL_PHASES) {
				if (phaseAllowsManualAdvance[phase]) {
					expect(phaseAllowsEmoji[phase]).toBe(true);
				}
			}
		});

		it('question phases should not allow emoji', () => {
			// During question phases, players should focus on answering
			expect(phaseAllowsEmoji.QUESTION).toBe(false);
			expect(phaseAllowsEmoji.QUESTION_MODIFIER).toBe(false);
		});
	});
});
