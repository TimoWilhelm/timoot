import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

interface SoundStoreState {
	readonly isMuted: boolean;
	readonly volume: number;
	readonly isBlocked: boolean;
	readonly toggleMute: () => void;
	readonly setMuted: (muted: boolean) => void;
	readonly setVolume: (volume: number) => void;
	readonly setBlocked: (blocked: boolean) => void;
}

// ============================================================================
// Store
// ============================================================================

/** Persisted store for sound settings (mute state and volume). */
export const useSoundStore = create<SoundStoreState>()(
	persist(
		(set) => ({
			isMuted: false,
			volume: 0.5,
			isBlocked: false,

			toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
			setMuted: (muted) => set({ isMuted: muted }),
			setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
			setBlocked: (blocked) => set({ isBlocked: blocked }),
		}),
		{
			name: 'timoot-sound-settings',
			partialize: (state) => ({ isMuted: state.isMuted, volume: state.volume }),
		},
	),
);
