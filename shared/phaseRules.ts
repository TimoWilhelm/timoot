import type { GamePhase } from './types';

export const phaseAllowsEmoji: Record<GamePhase, boolean> = {
	LOBBY: true,
	GET_READY: true,
	QUESTION_MODIFIER: true,
	QUESTION: false,
	REVEAL: true,
	LEADERBOARD: true,
	END: true,
};
