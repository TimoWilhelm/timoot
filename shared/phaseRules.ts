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
