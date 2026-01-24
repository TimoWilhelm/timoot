import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

interface HostStoreState {
	readonly secrets: Record<string, string>;
	readonly addSecret: (gameId: string, secret: string) => void;
	readonly getSecret: (gameId: string) => string | undefined;
}

// ============================================================================
// Store
// ============================================================================

/** Persisted store for host secrets (gameId -> hostSecret mapping). */
export const useHostStore = create<HostStoreState>()(
	persist(
		(set, get) => ({
			secrets: {},

			addSecret: (gameId, secret) =>
				set((state) => ({
					secrets: { ...state.secrets, [gameId]: secret },
				})),

			getSecret: (gameId) => get().secrets[gameId],
		}),
		{
			name: 'timoot-host-storage',
			storage: createJSONStorage(() => localStorage),
		},
	),
);
