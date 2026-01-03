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
export interface SoundDefinition {
	play: (context: AudioContext, gainNode: GainNode) => void;
}

export type MusicTrack = 'lobby' | 'getReady' | 'questionModifier' | 'question' | 'reveal' | 'leaderboard' | 'celebration';

export const MUSIC_TRACKS: Record<MusicTrack, string> = {
	lobby: '/music/Your Call.mp3',
	getReady: '/music/Funky Chunk.mp3',
	questionModifier: '/music/Hustle.mp3',
	question: '/music/Hustle.mp3',
	reveal: '/music/Private Eye.mp3',
	leaderboard: '/music/Private Eye.mp3',
	celebration: '/music/Beachfront Celebration.mp3',
};

export const BACKGROUND_MUSIC_VOLUME = 0.3; // Lower volume for background music

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

export const sounds: Record<SoundType, SoundDefinition> = {
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
