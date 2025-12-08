import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SoundStore {
	isMuted: boolean;
	volume: number;
	toggleMute: () => void;
	setMuted: (muted: boolean) => void;
	setVolume: (volume: number) => void;
}

export const useSoundStore = create<SoundStore>()(
	persist(
		(set) => ({
			isMuted: false,
			volume: 0.5,
			toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
			setMuted: (muted) => set({ isMuted: muted }),
			setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
		}),
		{
			name: 'timoot-sound-settings',
		},
	),
);
