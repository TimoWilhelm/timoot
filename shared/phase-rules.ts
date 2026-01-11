import { createMachine } from './fsm';

import type { GamePhase } from './types';

export const phaseAllowsEmoji: Record<GamePhase, boolean> = {
	LOBBY: true,
	GET_READY: true,
	QUESTION_MODIFIER: false,
	QUESTION: false,
	REVEAL: true,
	LEADERBOARD: true,
	END_INTRO: true,
	END_REVEALED: true,
};

export const isGamePhaseActive: Record<GamePhase, boolean> = {
	LOBBY: false,
	GET_READY: true,
	QUESTION_MODIFIER: true,
	QUESTION: true,
	REVEAL: true,
	LEADERBOARD: true,
	END_INTRO: false,
	END_REVEALED: false,
};

export const phaseAllowsManualAdvance: Record<GamePhase, boolean> = {
	LOBBY: false,
	GET_READY: false,
	QUESTION_MODIFIER: false,
	QUESTION: false,
	REVEAL: true,
	LEADERBOARD: true,
	END_INTRO: false,
	END_REVEALED: false,
};

// Game phase state machine events
export type GamePhaseEvent =
	| 'START_GAME' // LOBBY → GET_READY (host starts game)
	| 'TIMER_WITH_MODIFIER' // GET_READY → QUESTION_MODIFIER (auto, question has modifier)
	| 'TIMER_NO_MODIFIER' // GET_READY → QUESTION (auto, no modifier)
	| 'TIMER_MODIFIER_DONE' // QUESTION_MODIFIER → QUESTION (auto, modifier displayed)
	| 'ALL_ANSWERED' // QUESTION → REVEAL (auto or manual)
	| 'TIME_EXPIRED' // QUESTION → REVEAL (auto or manual)
	| 'REVEAL_NEXT' // REVEAL → LEADERBOARD (host advances, more questions)
	| 'REVEAL_FINAL' // REVEAL → END_INTRO (host advances, was last question)
	| 'NEXT_QUESTION' // LEADERBOARD → QUESTION_MODIFIER/QUESTION (host advances)
	| 'LEADERBOARD_FINAL' // LEADERBOARD → END_INTRO (last question done)
	| 'REVEAL_WINNER'; // END_INTRO → END_REVEALED (auto after delay)

export const gamePhaseMachine = createMachine<GamePhase, GamePhaseEvent>({
	LOBBY: { START_GAME: 'GET_READY' },
	GET_READY: { TIMER_WITH_MODIFIER: 'QUESTION_MODIFIER', TIMER_NO_MODIFIER: 'QUESTION' },
	QUESTION_MODIFIER: { TIMER_MODIFIER_DONE: 'QUESTION' },
	QUESTION: { ALL_ANSWERED: 'REVEAL', TIME_EXPIRED: 'REVEAL' },
	REVEAL: { REVEAL_NEXT: 'LEADERBOARD', REVEAL_FINAL: 'END_INTRO' },
	LEADERBOARD: { NEXT_QUESTION: 'QUESTION', LEADERBOARD_FINAL: 'END_INTRO' },
	END_INTRO: { REVEAL_WINNER: 'END_REVEALED' },
	END_REVEALED: {}, // Terminal state
});
