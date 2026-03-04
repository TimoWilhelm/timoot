import { createMachine } from './fsm';

import type { GamePhase } from './types';

export const phaseAllowsEmoji: Record<GamePhase, boolean> = {
	LOBBY: true,
	GET_READY: true,
	QUESTION_MODIFIER: false,
	'QUESTION:READING': false,
	'QUESTION:ANSWERING': false,
	REVEAL: true,
	LEADERBOARD: true,
	'END:INTRO': true,
	'END:REVEALED': true,
};

export const isGamePhaseActive: Record<GamePhase, boolean> = {
	LOBBY: false,
	GET_READY: true,
	QUESTION_MODIFIER: true,
	'QUESTION:READING': true,
	'QUESTION:ANSWERING': true,
	REVEAL: true,
	LEADERBOARD: true,
	'END:INTRO': false,
	'END:REVEALED': false,
};

export const phaseAllowsManualAdvance: Record<GamePhase, boolean> = {
	LOBBY: false,
	GET_READY: false,
	QUESTION_MODIFIER: false,
	'QUESTION:READING': false,
	'QUESTION:ANSWERING': false,
	REVEAL: true,
	LEADERBOARD: true,
	'END:INTRO': false,
	'END:REVEALED': false,
};

// Game phase state machine events
export type GamePhaseEvent =
	| 'START_GAME' // LOBBY → GET_READY (host starts game)
	| 'TIMER_WITH_MODIFIER' // GET_READY → QUESTION_MODIFIER (auto, question has modifier)
	| 'TIMER_NO_MODIFIER' // GET_READY → QUESTION:READING (auto, no modifier)
	| 'TIMER_MODIFIER_DONE' // QUESTION_MODIFIER → QUESTION:READING (auto, modifier displayed)
	| 'READING_DONE' // QUESTION:READING → QUESTION:ANSWERING (auto, reading period ended)
	| 'ALL_ANSWERED' // QUESTION:ANSWERING → REVEAL (auto, all players answered)
	| 'TIME_EXPIRED' // QUESTION:ANSWERING → REVEAL (auto, server alarm)
	| 'REVEAL_NEXT' // REVEAL → LEADERBOARD (host advances, more questions)
	| 'REVEAL_FINAL' // REVEAL → END:INTRO (host advances, was last question)
	| 'NEXT_QUESTION' // LEADERBOARD → QUESTION:READING (host advances)
	| 'LEADERBOARD_FINAL' // LEADERBOARD → END:INTRO (last question done)
	| 'REVEAL_WINNER'; // END:INTRO → END:REVEALED (auto after delay)

export const gamePhaseMachine = createMachine<GamePhase, GamePhaseEvent>({
	LOBBY: { START_GAME: 'GET_READY' },
	GET_READY: { TIMER_WITH_MODIFIER: 'QUESTION_MODIFIER', TIMER_NO_MODIFIER: 'QUESTION:READING' },
	QUESTION_MODIFIER: { TIMER_MODIFIER_DONE: 'QUESTION:READING' },
	'QUESTION:READING': { READING_DONE: 'QUESTION:ANSWERING' },
	'QUESTION:ANSWERING': { ALL_ANSWERED: 'REVEAL', TIME_EXPIRED: 'REVEAL' },
	REVEAL: { REVEAL_NEXT: 'LEADERBOARD', REVEAL_FINAL: 'END:INTRO' },
	LEADERBOARD: { NEXT_QUESTION: 'QUESTION:READING', LEADERBOARD_FINAL: 'END:INTRO' },
	'END:INTRO': { REVEAL_WINNER: 'END:REVEALED' },
	'END:REVEALED': {}, // Terminal state
});
