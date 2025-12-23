import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { GameState } from '@shared/types';
interface GameStoreState {
	gameState: GameState | null;
	gameId: string | null;
	playerId: string | null;
	playerToken: string | null;
	nickname: string | null;
	setGameState: (state: GameState) => void;
	setSession: (session: { gameId: string; playerId: string; playerToken: string; nickname: string }) => void;
	clearSession: () => void;
}
export const useGameStore = create<GameStoreState>()(
	persist(
		(set) => ({
			gameState: null,
			gameId: null,
			playerId: null,
			playerToken: null,
			nickname: null,
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
					gameId: null,
					playerId: null,
					playerToken: null,
					nickname: null,
					gameState: null,
				}),
		}),
		{
			name: 'timoot-player-session',
			storage: createJSONStorage(() => localStorage), // Use localStorage for persistence
		},
	),
);
