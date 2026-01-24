import { useCallback, useEffect, useRef } from 'react';

// ============================================================================
// Constants
// ============================================================================

const SOUNDS = {
	join: '/sounds/join.mp3',
	correct: '/sounds/correct.mp3',
	incorrect: '/sounds/incorrect.mp3',
	tick: '/sounds/tick.mp3',
	gameStart: '/sounds/game-start.mp3',
} as const;

// ============================================================================
// Types
// ============================================================================

type SoundEvent = keyof typeof SOUNDS;

interface UseSoundReturn {
	readonly playSound: (sound: SoundEvent) => void;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for playing game sound effects.
 *
 * Pre-creates an audio element for better performance and
 * to handle browser autoplay restrictions.
 *
 * @example
 * ```tsx
 * const { playSound } = useSound();
 * playSound('correct');
 * ```
 */
export function useSound(): UseSoundReturn {
	const audioReference = useRef<HTMLAudioElement | undefined>(undefined);

	useEffect(() => {
		audioReference.current = new Audio();
		audioReference.current.volume = 0.5;

		return () => {
			if (audioReference.current) {
				audioReference.current.pause();
				audioReference.current = undefined;
			}
		};
	}, []);

	const playSound = useCallback((sound: SoundEvent) => {
		if (audioReference.current) {
			// In a real application, you would uncomment the following lines.
			// For this simulation, we will log to the console instead.
			// audioRef.current.src = SOUNDS[sound];
			// audioRef.current.play().catch(error => {
			//   console.error(`Could not play sound: ${sound}`, error);
			// });
			console.log(`[SOUND] Playing sound: ${sound} at ${SOUNDS[sound]}`);
		}
	}, []);

	return { playSound };
}
