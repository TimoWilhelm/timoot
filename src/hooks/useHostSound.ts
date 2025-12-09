import { useCallback, useEffect, useRef } from 'react';
import { useSoundStore } from '@/lib/sound-store';

type SoundType =
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
	play: (ctx: AudioContext, gainNode: GainNode) => void;
}

const createOscillator = (ctx: AudioContext, type: OscillatorType, frequency: number, duration: number, gain: GainNode, startTime = 0) => {
	const osc = ctx.createOscillator();
	const oscGain = ctx.createGain();
	osc.type = type;
	osc.frequency.value = frequency;
	osc.connect(oscGain);
	oscGain.connect(gain);

	const now = ctx.currentTime + startTime;
	oscGain.gain.setValueAtTime(0.3, now);
	oscGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

	osc.start(now);
	osc.stop(now + duration);
};

const sounds: Record<SoundType, SoundDefinition> = {
	tick: {
		play: (ctx, gain) => {
			// Soft tick - low pitch click
			createOscillator(ctx, 'sine', 800, 0.08, gain);
		},
	},
	tickUrgent: {
		play: (ctx, gain) => {
			// Urgent tick - higher pitch, sharper
			createOscillator(ctx, 'square', 1200, 0.1, gain);
			createOscillator(ctx, 'sine', 600, 0.05, gain, 0.05);
		},
	},
	timeUp: {
		play: (ctx, gain) => {
			// Buzzer sound - descending tone
			const osc = ctx.createOscillator();
			const oscGain = ctx.createGain();
			osc.type = 'sawtooth';
			osc.frequency.setValueAtTime(400, ctx.currentTime);
			osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.3);
			osc.connect(oscGain);
			oscGain.connect(gain);
			oscGain.gain.setValueAtTime(0.2, ctx.currentTime);
			oscGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
			osc.start();
			osc.stop(ctx.currentTime + 0.3);
		},
	},
	playerJoin: {
		play: (ctx, gain) => {
			// Cheerful two-note chime
			createOscillator(ctx, 'sine', 523, 0.15, gain); // C5
			createOscillator(ctx, 'sine', 659, 0.2, gain, 0.1); // E5
		},
	},
	gameStart: {
		play: (ctx, gain) => {
			// Exciting ascending fanfare
			createOscillator(ctx, 'sine', 523, 0.15, gain); // C5
			createOscillator(ctx, 'sine', 659, 0.15, gain, 0.12); // E5
			createOscillator(ctx, 'sine', 784, 0.15, gain, 0.24); // G5
			createOscillator(ctx, 'sine', 1047, 0.3, gain, 0.36); // C6
		},
	},
	questionStart: {
		play: (ctx, gain) => {
			// Quick attention-getting swoosh
			const osc = ctx.createOscillator();
			const oscGain = ctx.createGain();
			osc.type = 'sine';
			osc.frequency.setValueAtTime(300, ctx.currentTime);
			osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
			osc.connect(oscGain);
			oscGain.connect(gain);
			oscGain.gain.setValueAtTime(0.25, ctx.currentTime);
			oscGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
			osc.start();
			osc.stop(ctx.currentTime + 0.2);
		},
	},
	doublePoints: {
		play: (ctx, gain) => {
			// Exciting power-up sound
			const freqs = [392, 523, 659, 784, 1047]; // G4, C5, E5, G5, C6
			freqs.forEach((freq, i) => {
				createOscillator(ctx, 'sine', freq, 0.2, gain, i * 0.08);
				createOscillator(ctx, 'triangle', freq * 2, 0.15, gain, i * 0.08);
			});
		},
	},
	reveal: {
		play: (ctx, gain) => {
			// Dramatic reveal sound
			createOscillator(ctx, 'sine', 400, 0.3, gain);
			createOscillator(ctx, 'triangle', 600, 0.25, gain, 0.1);
		},
	},
	correct: {
		play: (ctx, gain) => {
			// Celebratory correct sound
			createOscillator(ctx, 'sine', 523, 0.12, gain); // C5
			createOscillator(ctx, 'sine', 659, 0.12, gain, 0.1); // E5
			createOscillator(ctx, 'sine', 784, 0.2, gain, 0.2); // G5
		},
	},
	leaderboard: {
		play: (ctx, gain) => {
			// Triumphant leaderboard reveal
			createOscillator(ctx, 'sine', 392, 0.2, gain); // G4
			createOscillator(ctx, 'sine', 494, 0.2, gain, 0.15); // B4
			createOscillator(ctx, 'sine', 587, 0.25, gain, 0.3); // D5
		},
	},
	rankUp: {
		play: (ctx, gain) => {
			// Quick ascending arpeggio for rank change
			createOscillator(ctx, 'sine', 440, 0.1, gain);
			createOscillator(ctx, 'sine', 554, 0.1, gain, 0.08);
			createOscillator(ctx, 'sine', 659, 0.15, gain, 0.16);
		},
	},
	gameEnd: {
		play: (ctx, gain) => {
			// Grand finale fanfare
			const notes = [523, 659, 784, 880, 1047]; // C5, E5, G5, A5, C6
			notes.forEach((freq, i) => {
				createOscillator(ctx, 'sine', freq, 0.25, gain, i * 0.12);
				if (i === notes.length - 1) {
					// Final note is longer and richer
					createOscillator(ctx, 'triangle', freq / 2, 0.5, gain, i * 0.12);
				}
			});
		},
	},
	countdown321: {
		play: (ctx, gain) => {
			// Single countdown beep
			createOscillator(ctx, 'sine', 880, 0.15, gain); // A5
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
	const audioContextRef = useRef<AudioContext | null>(null);
	const masterGainRef = useRef<GainNode | null>(null);
	const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
	const currentTrackRef = useRef<MusicTrack | null>(null);
	const { isMuted, volume } = useSoundStore();
	const lastTickTimeRef = useRef<number>(0);

	// Initialize audio context lazily (must be triggered by user interaction)
	const initAudio = useCallback(() => {
		if (!audioContextRef.current) {
			audioContextRef.current = new AudioContext();
			masterGainRef.current = audioContextRef.current.createGain();
			masterGainRef.current.connect(audioContextRef.current.destination);
		}
		// Resume if suspended (browser autoplay policy)
		if (audioContextRef.current.state === 'suspended') {
			audioContextRef.current.resume();
		}
		return { ctx: audioContextRef.current, gain: masterGainRef.current! };
	}, []);

	// Update master volume when settings change
	useEffect(() => {
		if (masterGainRef.current) {
			masterGainRef.current.gain.value = isMuted ? 0 : volume;
		}
		// Update background music volume/mute
		if (backgroundMusicRef.current) {
			backgroundMusicRef.current.volume = isMuted ? 0 : volume * BACKGROUND_MUSIC_VOLUME;
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
			if (now - lastTickTimeRef.current < 800) return;
			lastTickTimeRef.current = now;

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
				const currentTrackPath = currentTrackRef.current ? MUSIC_TRACKS[currentTrackRef.current] : null;
				const isSameFile = currentTrackPath === newTrackPath;

				// If same file is already playing and not forcing restart, just continue
				if (isSameFile && backgroundMusicRef.current && !backgroundMusicRef.current.paused && !forceRestart) {
					// Just update volume in case it changed
					backgroundMusicRef.current.volume = isMuted ? 0 : volume * BACKGROUND_MUSIC_VOLUME;
					currentTrackRef.current = track;
					return;
				}

				// If switching to a different file, create new audio element
				if (!isSameFile || !backgroundMusicRef.current) {
					if (backgroundMusicRef.current) {
						backgroundMusicRef.current.pause();
					}
					backgroundMusicRef.current = new Audio(newTrackPath);
					backgroundMusicRef.current.loop = true;
				}

				currentTrackRef.current = track;
				backgroundMusicRef.current.volume = isMuted ? 0 : volume * BACKGROUND_MUSIC_VOLUME;

				// Only reset to beginning if switching files or forcing restart
				if (!isSameFile || forceRestart) {
					backgroundMusicRef.current.currentTime = 0;
				}

				backgroundMusicRef.current.play().catch((err) => {
					console.warn('Failed to play background music:', err);
				});
			} catch (error) {
				console.warn('Failed to start background music:', error);
			}
		},
		[isMuted, volume],
	);

	// Stop background music with fade out
	const stopBackgroundMusic = useCallback(() => {
		if (backgroundMusicRef.current) {
			const audio = backgroundMusicRef.current;
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
			if (audioContextRef.current) {
				audioContextRef.current.close();
			}
			if (backgroundMusicRef.current) {
				backgroundMusicRef.current.pause();
				backgroundMusicRef.current = null;
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
