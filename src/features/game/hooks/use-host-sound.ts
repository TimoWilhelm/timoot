import { useCallback, useEffect, useRef } from 'react';

import { BACKGROUND_MUSIC_VOLUME, MUSIC_TRACKS, MusicTrack, SoundType, sounds } from '@/lib/sound-definitions';
import { useSoundStore } from '@/lib/stores/sound-store';

export function useHostSound() {
	const audioContextReference = useRef<AudioContext | null>(null);
	const masterGainReference = useRef<GainNode | null>(null);
	const backgroundMusicReference = useRef<HTMLAudioElement | null>(null);
	const currentTrackReference = useRef<MusicTrack | null>(null);
	const { isMuted, volume, setBlocked } = useSoundStore();
	const lastTickTimeReference = useRef<number>(0);

	// Initialize audio context lazily (must be triggered by user interaction)
	const initAudio = useCallback(() => {
		if (!audioContextReference.current) {
			audioContextReference.current = new AudioContext();
			masterGainReference.current = audioContextReference.current.createGain();
			masterGainReference.current.connect(audioContextReference.current.destination);
		}
		// Resume if suspended (browser autoplay policy)
		if (audioContextReference.current.state === 'suspended') {
			void audioContextReference.current.resume();
		}
		setBlocked(false);
		return { ctx: audioContextReference.current, gain: masterGainReference.current! };
	}, [setBlocked]);

	// Update master volume when settings change
	useEffect(() => {
		if (masterGainReference.current) {
			masterGainReference.current.gain.value = isMuted ? 0 : volume;
		}
		// Update background music volume/mute
		if (backgroundMusicReference.current) {
			backgroundMusicReference.current.volume = isMuted ? 0 : volume * BACKGROUND_MUSIC_VOLUME;
		}
	}, [isMuted, volume]);

	const playSound = useCallback(
		(sound: SoundType) => {
			if (isMuted) return;

			try {
				const { ctx, gain } = initAudio();
				gain.gain.value = volume;
				sounds[sound].play(ctx, gain);
			} catch (error) {
				console.warn('Failed to play sound:', error);
			}
		},
		[isMuted, volume, initAudio],
	);

	// Specialized function for countdown that handles tick timing logic
	const playCountdownTick = useCallback(
		(timeLeft: number) => {
			if (isMuted) return;

			// Debounce to prevent multiple ticks per second
			const now = Date.now();
			if (now - lastTickTimeReference.current < 800) return;
			lastTickTimeReference.current = now;

			if (timeLeft <= 3 && timeLeft > 0) {
				playSound('tickUrgent');
			} else if (timeLeft <= 5 && timeLeft > 0) {
				playSound('tick');
			}
		},
		[isMuted, playSound],
	);

	// Start background music
	const startBackgroundMusic = useCallback(
		(track: MusicTrack = 'question', forceRestart = false) => {
			try {
				const newTrackPath = MUSIC_TRACKS[track];
				const currentTrackPath = currentTrackReference.current ? MUSIC_TRACKS[currentTrackReference.current] : undefined;
				const isSameFile = currentTrackPath === newTrackPath;

				// If same file and not forcing restart, ensure it's playing and update volume
				if (isSameFile && backgroundMusicReference.current && !forceRestart) {
					backgroundMusicReference.current.volume = isMuted ? 0 : volume * BACKGROUND_MUSIC_VOLUME;
					currentTrackReference.current = track;
					// Resume if paused (e.g., after reconnection) without restarting from beginning
					if (backgroundMusicReference.current.paused) {
						backgroundMusicReference.current
							.play()
							.then(() => setBlocked(false))
							.catch((error) => {
								if (error.name === 'NotAllowedError') {
									setBlocked(true);
								}
								console.warn('Failed to resume background music:', error);
							});
					} else {
						// Already playing - audio is working
						setBlocked(false);
					}
					return;
				}

				// If switching to a different file, create new audio element
				if (!isSameFile || !backgroundMusicReference.current) {
					if (backgroundMusicReference.current) {
						backgroundMusicReference.current.pause();
					}
					backgroundMusicReference.current = new Audio(newTrackPath);
					backgroundMusicReference.current.loop = true;
				}

				currentTrackReference.current = track;
				backgroundMusicReference.current.volume = isMuted ? 0 : volume * BACKGROUND_MUSIC_VOLUME;

				// Only reset to beginning if switching files or forcing restart
				if (!isSameFile || forceRestart) {
					backgroundMusicReference.current.currentTime = 0;
				}

				backgroundMusicReference.current
					.play()
					.then(() => setBlocked(false))
					.catch((error) => {
						if (error.name === 'NotAllowedError') {
							setBlocked(true);
						}
						console.warn('Failed to play background music:', error);
					});
			} catch (error) {
				console.warn('Failed to start background music:', error);
			}
		},
		[isMuted, volume, setBlocked],
	);

	// Stop background music with fade out
	const stopBackgroundMusic = useCallback(() => {
		if (backgroundMusicReference.current) {
			const audio = backgroundMusicReference.current;
			// Fade out over 300ms
			const fadeOut = () => {
				if (audio.volume > 0.05) {
					audio.volume = Math.max(0, audio.volume - 0.05);
					requestAnimationFrame(fadeOut);
				} else {
					audio.pause();
					audio.currentTime = 0;
				}
			};
			fadeOut();
		}
	}, []);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (audioContextReference.current) {
				void audioContextReference.current.close();
			}
			if (backgroundMusicReference.current) {
				backgroundMusicReference.current.pause();
				// eslint-disable-next-line unicorn/no-null
				backgroundMusicReference.current = null;
			}
		};
	}, []);

	return {
		playSound,
		playCountdownTick,
		initAudio, // Expose for initializing on first user interaction
		startBackgroundMusic,
		stopBackgroundMusic,
	};
}

export { type SoundType, type MusicTrack } from '@/lib/sound-definitions';
