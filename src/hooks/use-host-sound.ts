import { useCallback, useEffect, useRef } from 'react';

import { useSoundStore } from '@/lib/sound-store';

export type SoundType =
	| 'tick' // Countdown tick (5-4 seconds)
	| 'tickUrgent' // Critical countdown (3-2-1 seconds)
	| 'timeUp' // Time ran out
	| 'playerJoin' // Player joined lobby
	| 'gameStart' // Game starting
	| 'questionStart' // New question appearing
	| 'doublePoints' // 2x points fanfare
	| 'reveal' // Answer reveal
	| 'correct' // Correct answer celebration
	| 'leaderboard' // Leaderboard shown
	| 'rankUp' // Player moved up in rank
	| 'gameEnd' // Game finished fanfare
	| 'countdown321'; // Get ready countdown beeps

// Sound definitions using Web Audio API synthesis
interface SoundDefinition {
	play: (context: AudioContext, gainNode: GainNode) => void;
}

const createOscillator = (
	context: AudioContext,
	type: OscillatorType,
	frequency: number,
	duration: number,
	gain: GainNode,
	startTime = 0,
) => {
	const osc = context.createOscillator();
	const oscGain = context.createGain();
	osc.type = type;
	osc.frequency.value = frequency;
	osc.connect(oscGain);
	oscGain.connect(gain);

	const now = context.currentTime + startTime;
	oscGain.gain.setValueAtTime(0.3, now);
	oscGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

	osc.start(now);
	osc.stop(now + duration);
};

const sounds: Record<SoundType, SoundDefinition> = {
	tick: {
		play: (context, gain) => {
			// Soft tick - low pitch click
			createOscillator(context, 'sine', 800, 0.08, gain);
		},
	},
	tickUrgent: {
		play: (context, gain) => {
			// Urgent tick - higher pitch, sharper
			createOscillator(context, 'square', 1200, 0.1, gain);
			createOscillator(context, 'sine', 600, 0.05, gain, 0.05);
		},
	},
	timeUp: {
		play: (context, gain) => {
			// Buzzer sound - descending tone
			const osc = context.createOscillator();
			const oscGain = context.createGain();
			osc.type = 'sawtooth';
			osc.frequency.setValueAtTime(400, context.currentTime);
			osc.frequency.exponentialRampToValueAtTime(150, context.currentTime + 0.3);
			osc.connect(oscGain);
			oscGain.connect(gain);
			oscGain.gain.setValueAtTime(0.2, context.currentTime);
			oscGain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
			osc.start();
			osc.stop(context.currentTime + 0.3);
		},
	},
	playerJoin: {
		play: (context, gain) => {
			// Cheerful two-note chime
			createOscillator(context, 'sine', 523, 0.15, gain); // C5
			createOscillator(context, 'sine', 659, 0.2, gain, 0.1); // E5
		},
	},
	gameStart: {
		play: (context, gain) => {
			// Exciting ascending fanfare
			createOscillator(context, 'sine', 523, 0.15, gain); // C5
			createOscillator(context, 'sine', 659, 0.15, gain, 0.12); // E5
			createOscillator(context, 'sine', 784, 0.15, gain, 0.24); // G5
			createOscillator(context, 'sine', 1047, 0.3, gain, 0.36); // C6
		},
	},
	questionStart: {
		play: (context, gain) => {
			// Quick attention-getting swoosh
			const osc = context.createOscillator();
			const oscGain = context.createGain();
			osc.type = 'sine';
			osc.frequency.setValueAtTime(300, context.currentTime);
			osc.frequency.exponentialRampToValueAtTime(800, context.currentTime + 0.15);
			osc.connect(oscGain);
			oscGain.connect(gain);
			oscGain.gain.setValueAtTime(0.25, context.currentTime);
			oscGain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.2);
			osc.start();
			osc.stop(context.currentTime + 0.2);
		},
	},
	doublePoints: {
		play: (context, gain) => {
			// Exciting power-up sound
			const freqs = [392, 523, 659, 784, 1047]; // G4, C5, E5, G5, C6
			for (const [index, freq] of freqs.entries()) {
				createOscillator(context, 'sine', freq, 0.2, gain, index * 0.08);
				createOscillator(context, 'triangle', freq * 2, 0.15, gain, index * 0.08);
			}
		},
	},
	reveal: {
		play: (context, gain) => {
			// Dramatic reveal sound
			createOscillator(context, 'sine', 400, 0.3, gain);
			createOscillator(context, 'triangle', 600, 0.25, gain, 0.1);
		},
	},
	correct: {
		play: (context, gain) => {
			// Celebratory correct sound
			createOscillator(context, 'sine', 523, 0.12, gain); // C5
			createOscillator(context, 'sine', 659, 0.12, gain, 0.1); // E5
			createOscillator(context, 'sine', 784, 0.2, gain, 0.2); // G5
		},
	},
	leaderboard: {
		play: (context, gain) => {
			// Triumphant leaderboard reveal
			createOscillator(context, 'sine', 392, 0.2, gain); // G4
			createOscillator(context, 'sine', 494, 0.2, gain, 0.15); // B4
			createOscillator(context, 'sine', 587, 0.25, gain, 0.3); // D5
		},
	},
	rankUp: {
		play: (context, gain) => {
			// Quick ascending arpeggio for rank change
			createOscillator(context, 'sine', 440, 0.1, gain);
			createOscillator(context, 'sine', 554, 0.1, gain, 0.08);
			createOscillator(context, 'sine', 659, 0.15, gain, 0.16);
		},
	},
	gameEnd: {
		play: (context, gain) => {
			// Grand finale fanfare
			const notes = [523, 659, 784, 880, 1047]; // C5, E5, G5, A5, C6
			for (const [index, freq] of notes.entries()) {
				createOscillator(context, 'sine', freq, 0.25, gain, index * 0.12);
				if (index === notes.length - 1) {
					// Final note is longer and richer
					createOscillator(context, 'triangle', freq / 2, 0.5, gain, index * 0.12);
				}
			}
		},
	},
	countdown321: {
		play: (context, gain) => {
			// Single countdown beep
			createOscillator(context, 'sine', 880, 0.15, gain); // A5
		},
	},
};

export type MusicTrack = 'lobby' | 'getReady' | 'questionModifier' | 'question' | 'reveal' | 'leaderboard' | 'celebration';

const MUSIC_TRACKS: Record<MusicTrack, string> = {
	lobby: '/music/Your Call.mp3',
	getReady: '/music/Funky Chunk.mp3',
	questionModifier: '/music/Hustle.mp3',
	question: '/music/Hustle.mp3',
	reveal: '/music/Private Eye.mp3',
	leaderboard: '/music/Private Eye.mp3',
	celebration: '/music/Beachfront Celebration.mp3',
};

const BACKGROUND_MUSIC_VOLUME = 0.3; // Lower volume for background music

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
