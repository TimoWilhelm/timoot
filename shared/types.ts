import type { ErrorCodeType } from './errors';

export interface ApiResponse<T = unknown> {
	success: boolean;
	data?: T;
	error?: string;
}

// ============ SSE Event Types ============

export type GenerationStatus = {
	stage: 'researching' | 'reading_docs' | 'searching_web' | 'generating';
	detail?: string;
};

export type QuizGenerateSSEEvent =
	| { event: 'status'; data: GenerationStatus }
	| { event: 'complete'; data: ApiResponse<Quiz> }
	| { event: 'error'; data: ApiResponse };
export interface Question {
	text: string;
	options: string[];
	correctAnswerIndex: number;
	isDoublePoints?: boolean;
	backgroundImage?: string;
}
export interface Player {
	id: string;
	name: string;
	score: number;
	answered: boolean;
	/** Secure token for session reconnection - never shared with other players */
	token?: string;
}
export interface Answer {
	playerId: string;
	answerIndex: number;
	time: number; // Time in ms from question start
	isCorrect?: boolean;
	score?: number;
}
export type GamePhase = 'LOBBY' | 'GET_READY' | 'QUESTION_MODIFIER' | 'QUESTION' | 'REVEAL' | 'LEADERBOARD' | 'END_INTRO' | 'END_REVEALED';

// Question modifiers that can be applied
export type QuestionModifier = 'doublePoints';
export interface GameState {
	id: string;
	pin: string;
	phase: GamePhase;
	/** Monotonically increasing version number, incremented on every phase change. Used to reject stale nextState requests. */
	phaseVersion: number;
	players: Player[];
	questions: Question[];
	currentQuestionIndex: number;
	questionStartTime: number; // Unix timestamp in ms
	answers: Answer[];
	hostSecret?: string;
}
export interface Quiz {
	id: string;
	title: string;
	questions: Question[];
	type?: 'predefined' | 'custom';
}

// ============ WebSocket Message Types ============

export type ClientRole = 'host' | 'player';

// Emoji reactions players can send
export type EmojiReaction = '❤️' | '😂' | '🤔' | '🎉';
export const EMOJI_REACTIONS: EmojiReaction[] = ['❤️', '😂', '🤔', '🎉'];

// Client -> Server Messages
export type ClientMessage =
	| { type: 'connect'; role: 'host'; gameId: string; hostSecret: string }
	| { type: 'connect'; role: 'player'; gameId: string; playerId?: string; playerToken?: string; nickname?: string }
	| { type: 'join'; nickname: string }
	| { type: 'startGame' }
	| { type: 'submitAnswer'; answerIndex: number }
	| { type: 'nextState'; phaseVersion: number }
	| { type: 'sendEmoji'; emoji: EmojiReaction }
	| { type: 'removePlayer'; playerId: string };

// Server -> Client Messages
export type ServerMessage =
	| { type: 'connected'; role: ClientRole; playerId?: string; playerToken?: string }
	| { type: 'error'; code: ErrorCodeType; message: string }
	| { type: 'lobbyUpdate'; players: { id: string; name: string }[]; pin: string; gameId: string; phaseVersion: number }
	| { type: 'getReady'; countdownMs: number; totalQuestions: number; phaseVersion: number }
	| {
			type: 'questionModifier';
			questionIndex: number;
			totalQuestions: number;
			modifiers: QuestionModifier[];
			phaseVersion: number;
	  }
	| {
			type: 'questionStart';
			questionIndex: number;
			totalQuestions: number;
			questionText: string;
			options: string[];
			startTime: number;
			timeLimitMs: number;
			isDoublePoints?: boolean;
			backgroundImage?: string;
			phaseVersion: number;
	  }
	| { type: 'answerReceived'; answerIndex: number }
	| { type: 'playerAnswered'; playerId: string; answeredCount: number; totalPlayers: number }
	| {
			type: 'reveal';
			correctAnswerIndex: number;
			playerResult?: { isCorrect: boolean; score: number; answerIndex: number };
			answerCounts: number[]; // count per option for host display
			questionText: string;
			options: string[];
			phaseVersion: number;
	  }
	| {
			type: 'leaderboard';
			leaderboard: { id: string; name: string; score: number; rank: number }[];
			isLastQuestion: boolean;
			phaseVersion: number;
	  }
	| {
			type: 'gameEnd';
			finalLeaderboard: { id: string; name: string; score: number; rank: number }[];
			revealed: boolean;
			phaseVersion: number;
	  }
	| { type: 'playerJoined'; player: { id: string; name: string } }
	| { type: 'kicked'; reason: string }
	| { type: 'emojiReceived'; emoji: EmojiReaction; playerId: string };
