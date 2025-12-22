import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SoundStore {
	isMuted: boolean;
	volume: number;
	isBlocked: boolean;
	toggleMute: () => void;
	setMuted: (muted: boolean) => void;
	setVolume: (volume: number) => void;
	setBlocked: (blocked: boolean) => void;
}

export const useSoundStore = create<SoundStore>()(
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
