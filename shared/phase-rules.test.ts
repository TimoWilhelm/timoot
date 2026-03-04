import { describe, expect, it } from 'vitest';

import { phaseAllowsEmoji, isGamePhaseActive, phaseAllowsManualAdvance } from './phase-rules';
import { phaseGroup } from './types';

import type { GamePhase } from './types';

const ALL_PHASES: GamePhase[] = [
	'LOBBY',
	'GET_READY',
	'QUESTION_MODIFIER',
	'QUESTION:READING',
	'QUESTION:ANSWERING',
	'REVEAL',
	'LEADERBOARD',
	'END:INTRO',
	'END:REVEALED',
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

		it('disallows emoji during QUESTION:READING', () => {
			expect(phaseAllowsEmoji['QUESTION:READING']).toBe(false);
		});

		it('disallows emoji during QUESTION:ANSWERING', () => {
			expect(phaseAllowsEmoji['QUESTION:ANSWERING']).toBe(false);
		});

		it('allows emoji in REVEAL', () => {
			expect(phaseAllowsEmoji.REVEAL).toBe(true);
		});

		it('allows emoji in LEADERBOARD', () => {
			expect(phaseAllowsEmoji.LEADERBOARD).toBe(true);
		});

		it('allows emoji in END phases', () => {
			expect(phaseAllowsEmoji['END:INTRO']).toBe(true);
			expect(phaseAllowsEmoji['END:REVEALED']).toBe(true);
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
			expect(isGamePhaseActive['QUESTION:READING']).toBe(true);
			expect(isGamePhaseActive['QUESTION:ANSWERING']).toBe(true);
			expect(isGamePhaseActive.REVEAL).toBe(true);
			expect(isGamePhaseActive.LEADERBOARD).toBe(true);
		});

		it('END phases are not active', () => {
			expect(isGamePhaseActive['END:INTRO']).toBe(false);
			expect(isGamePhaseActive['END:REVEALED']).toBe(false);
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
			expect(phaseAllowsManualAdvance['QUESTION:READING']).toBe(false);
			expect(phaseAllowsManualAdvance['QUESTION:ANSWERING']).toBe(false);
		});

		it('allows manual advance in REVEAL and LEADERBOARD', () => {
			expect(phaseAllowsManualAdvance.REVEAL).toBe(true);
			expect(phaseAllowsManualAdvance.LEADERBOARD).toBe(true);
		});

		it('does not allow manual advance in END phases', () => {
			expect(phaseAllowsManualAdvance['END:INTRO']).toBe(false);
			expect(phaseAllowsManualAdvance['END:REVEALED']).toBe(false);
		});
	});

	describe('phaseGroup', () => {
		it('returns the phase itself for phases without sub-phases', () => {
			expect(phaseGroup('LOBBY')).toBe('LOBBY');
			expect(phaseGroup('GET_READY')).toBe('GET_READY');
			expect(phaseGroup('QUESTION_MODIFIER')).toBe('QUESTION_MODIFIER');
			expect(phaseGroup('REVEAL')).toBe('REVEAL');
			expect(phaseGroup('LEADERBOARD')).toBe('LEADERBOARD');
		});

		it('groups QUESTION:READING and QUESTION:ANSWERING together', () => {
			expect(phaseGroup('QUESTION:READING')).toBe(phaseGroup('QUESTION:ANSWERING'));
			expect(phaseGroup('QUESTION:READING')).toBe('QUESTION');
		});

		it('groups END:INTRO and END:REVEALED together', () => {
			expect(phaseGroup('END:INTRO')).toBe(phaseGroup('END:REVEALED'));
			expect(phaseGroup('END:INTRO')).toBe('END');
		});

		it('keeps distinct phases in separate groups', () => {
			const distinctPhases: GamePhase[] = [
				'LOBBY',
				'GET_READY',
				'QUESTION_MODIFIER',
				'QUESTION:READING',
				'REVEAL',
				'LEADERBOARD',
				'END:INTRO',
			];
			const groups = distinctPhases.map((p) => phaseGroup(p));
			expect(new Set(groups).size).toBe(distinctPhases.length);
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
			expect(phaseAllowsEmoji['QUESTION:READING']).toBe(false);
			expect(phaseAllowsEmoji['QUESTION:ANSWERING']).toBe(false);
			expect(phaseAllowsEmoji.QUESTION_MODIFIER).toBe(false);
		});
	});
});
