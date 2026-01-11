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

// Game phase state machine

type GamePhaseEvent = 'START_GAME' | 'NEXT' | 'REVEAL_WINNER';

export const gamePhaseMachine = createMachine<GamePhase, GamePhaseEvent>({
	LOBBY: { START_GAME: 'GET_READY' },
	GET_READY: { NEXT: 'QUESTION' },
	QUESTION_MODIFIER: { NEXT: 'QUESTION' },
	QUESTION: { NEXT: 'REVEAL' },
	REVEAL: { NEXT: 'LEADERBOARD' },
	LEADERBOARD: { NEXT: 'GET_READY', START_GAME: 'END_INTRO' }, // NEXT for more questions, START_GAME (reused) for final
	END_INTRO: { REVEAL_WINNER: 'END_REVEALED' },
	END_REVEALED: {}, // Terminal state
});
