import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { GameState } from '@shared/types';
interface GameStoreState {
	gameState: GameState | undefined;
	gameId: string | undefined;
	playerId: string | undefined;
	playerToken: string | undefined;
	nickname: string | undefined;
	setGameState: (state: GameState) => void;
	setSession: (session: { gameId: string; playerId: string; playerToken: string; nickname: string }) => void;
	clearSession: () => void;
}
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
			storage: createJSONStorage(() => localStorage), // Use localStorage for persistence
		},
	),
);
