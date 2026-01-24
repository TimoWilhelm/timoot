import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { GameState } from '@shared/types';

// ============================================================================
// Types
// ============================================================================

interface SessionData {
	readonly gameId: string;
	readonly playerId: string;
	readonly playerToken: string;
	readonly nickname: string;
}

interface GameStoreState {
	readonly gameState: GameState | undefined;
	readonly gameId: string | undefined;
	readonly playerId: string | undefined;
	readonly playerToken: string | undefined;
	readonly nickname: string | undefined;
	readonly setGameState: (state: GameState) => void;
	readonly setSession: (session: SessionData) => void;
	readonly clearSession: () => void;
}

// ============================================================================
// Store
// ============================================================================

/** Persisted store for player game session data. */
export const useGameStore = create<GameStoreState>()(
	persist(
		(set) => ({
			gameState: undefined,
			gameId: undefined,
			playerId: undefined,
			playerToken: undefined,
			nickname: undefined,

			setGameState: (state) => set({ gameState: state }),

			setSession: (session) =>
				set({
					gameId: session.gameId,
					playerId: session.playerId,
					playerToken: session.playerToken,
					nickname: session.nickname,
				}),

			clearSession: () =>
				set({
					gameId: undefined,
					playerId: undefined,
					playerToken: undefined,
					nickname: undefined,
					gameState: undefined,
				}),
		}),
		{
			name: 'timoot-player-session',
			storage: createJSONStorage(() => localStorage),
		},
	),
);
