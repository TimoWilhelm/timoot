import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { Sentry } from '@/lib/sentry';

import type { ErrorCodeType } from '@shared/errors';
import type { ClientMessage, ClientRole, EmojiReaction, GamePhase, QuestionModifier, ServerMessage } from '@shared/types';

// Game state derived from WebSocket messages
export interface LeaderboardEntry {
	id: string;
	name: string;
	score: number;
	rank: number;
	previousRank?: number; // undefined means new to top-5
}

export interface WebSocketGameState {
	phase: GamePhase;
	gameId: string;
	pin: string;
	players: { id: string; name: string }[];
	// Get Ready phase
	getReadyCountdownMs: number;
	// Question Modifier phase
	modifiers: QuestionModifier[];
	// Question phase
	questionIndex: number;
	totalQuestions: number;
	questionText: string;
	options: string[];
	startTime: number;
	timeLimitMs: number;
	isDoublePoints: boolean;
	backgroundImage: string | undefined;
	// Answer tracking (for host)
	answeredCount: number;
	// Reveal phase
	correctAnswerIndex: number | undefined;
	playerResult: { isCorrect: boolean; score: number; answerIndex: number } | undefined;
	answerCounts: number[];
	// Leaderboard
	leaderboard: LeaderboardEntry[];
	isLastQuestion: boolean;
	// End phase
	endRevealed: boolean;
}

interface UseGameWebSocketOptions {
	gameId: string;
	role: ClientRole;
	hostSecret?: string;
	playerId?: string;
	playerToken?: string;
	onError?: (code: ErrorCodeType, message: string) => void;
	onConnected?: (playerId?: string, playerToken?: string) => void;
	onPlayerJoined?: (player: { id: string; name: string }) => void;
	onEmojiReceived?: (emoji: EmojiReaction, playerId: string) => void;
}

const initialGameState: WebSocketGameState = {
	phase: 'LOBBY',
	gameId: '',
	pin: '',
	players: [],
	getReadyCountdownMs: 0,
	modifiers: [],
	questionIndex: 0,
	totalQuestions: 0,
	questionText: '',
	options: [],
	startTime: 0,
	timeLimitMs: 20_000,
	isDoublePoints: false,
	backgroundImage: undefined,
	answeredCount: 0,
	correctAnswerIndex: undefined,
	playerResult: undefined,
	answerCounts: [],
	leaderboard: [],
	isLastQuestion: false,
	endRevealed: false,
};

export function useGameWebSocket({
	gameId,
	role,
	hostSecret,
	playerId,
	playerToken,
	onError,
	onConnected,
	onPlayerJoined,
	onEmojiReceived,
}: UseGameWebSocketOptions) {
	const wsReference = useRef<WebSocket | undefined>(undefined);
	const reconnectTimeoutReference = useRef<NodeJS.Timeout | undefined>(undefined);
	const [isConnected, setIsConnected] = useState(false);
	const [isConnecting, setIsConnecting] = useState(!!gameId);
	const [error, setError] = useState<string | undefined>();
	const [gameState, setGameState] = useState<WebSocketGameState>(initialGameState);
	const [submittedAnswer, setSubmittedAnswer] = useState<number | undefined>();

	const handleMessage = useCallback(
		(event: MessageEvent) => {
			try {
				const message = JSON.parse(event.data) as ServerMessage;

				switch (message.type) {
					case 'connected': {
						setIsConnected(true);
						setIsConnecting(false);
						setError(undefined);
						onConnected?.(message.playerId, message.playerToken);
						break;
					}

					case 'error': {
						setError(message.message);
						onError?.(message.code, message.message);
						break;
					}

					case 'lobbyUpdate': {
						setGameState((previous) => ({
							...previous,
							phase: 'LOBBY',
							gameId: message.gameId,
							pin: message.pin,
							players: message.players,
						}));
						break;
					}

					case 'getReady': {
						setGameState((previous) => ({
							...previous,
							phase: 'GET_READY',
							getReadyCountdownMs: message.countdownMs,
							totalQuestions: message.totalQuestions,
						}));
						break;
					}

					case 'questionModifier': {
						setGameState((previous) => ({
							...previous,
							phase: 'QUESTION_MODIFIER',
							questionIndex: message.questionIndex,
							totalQuestions: message.totalQuestions,
							modifiers: message.modifiers,
						}));
						break;
					}

					case 'playerJoined': {
						setGameState((previous) => ({
							...previous,
							players: [...previous.players, message.player],
						}));
						onPlayerJoined?.(message.player);
						break;
					}

					case 'questionStart': {
						setSubmittedAnswer(undefined);
						setGameState((previous) => ({
							...previous,
							phase: 'QUESTION',
							questionIndex: message.questionIndex,
							totalQuestions: message.totalQuestions,
							questionText: message.questionText,
							options: message.options,
							startTime: message.startTime,
							timeLimitMs: message.timeLimitMs,
							isDoublePoints: message.isDoublePoints ?? false,
							backgroundImage: message.backgroundImage,
							answeredCount: 0,
							correctAnswerIndex: undefined,
							playerResult: undefined,
							answerCounts: [],
						}));
						break;
					}

					case 'answerReceived': {
						setSubmittedAnswer(message.answerIndex);
						break;
					}

					case 'playerAnswered': {
						setGameState((previous) => ({
							...previous,
							answeredCount: message.answeredCount,
						}));
						break;
					}

					case 'reveal': {
						setGameState((previous) => ({
							...previous,
							phase: 'REVEAL',
							correctAnswerIndex: message.correctAnswerIndex,
							playerResult: message.playerResult,
							answerCounts: message.answerCounts,
							questionText: message.questionText,
							options: message.options,
						}));
						break;
					}

					case 'leaderboard': {
						setGameState((previous) => {
							// Build previous ranks from old leaderboard
							const previousRanks = new Map<string, number>();
							for (const [index, player] of previous.leaderboard.slice(0, 5).entries()) {
								previousRanks.set(player.id, index + 1);
							}

							// Enrich leaderboard entries with previousRank
							const enrichedLeaderboard: LeaderboardEntry[] = message.leaderboard.map((player) => ({
								...player,
								previousRank: previousRanks.get(player.id),
							}));

							return {
								...previous,
								phase: 'LEADERBOARD',
								leaderboard: enrichedLeaderboard,
								isLastQuestion: message.isLastQuestion,
							};
						});
						break;
					}

					case 'gameEnd': {
						setGameState((previous) => ({
							...previous,
							phase: message.revealed ? 'END_REVEALED' : 'END_INTRO',
							leaderboard: message.finalLeaderboard,
							endRevealed: message.revealed,
						}));
						break;
					}

					case 'kicked': {
						setError(message.reason);
						wsReference.current?.close();
						break;
					}

					case 'emojiReceived': {
						onEmojiReceived?.(message.emoji, message.playerId);
						break;
					}
				}
			} catch (error_) {
				console.error('Failed to parse WebSocket message:', error_);
				Sentry.captureException(error_, { tags: { source: 'websocket' } });
			}
		},
		[onConnected, onError, onPlayerJoined, onEmojiReceived],
	);

	// Store connect in a ref to enable self-reference for reconnection
	const connectReference = useRef<() => void>(undefined);

	const connect = useCallback(() => {
		// Prevent duplicate connections - check both OPEN and CONNECTING states
		if (wsReference.current?.readyState === WebSocket.OPEN || wsReference.current?.readyState === WebSocket.CONNECTING) return;

		setIsConnecting(true);
		setError(undefined);

		const protocol = globalThis.location.protocol === 'https:' ? 'wss:' : 'ws:';

		// Use separate endpoints for host vs player
		// Host endpoint requires token in query params and pre-authenticates
		// Player endpoint requires a connect message after connection
		const wsUrl =
			role === 'host'
				? `${protocol}//${globalThis.location.host}/api/games/${gameId}/host-ws?token=${encodeURIComponent(hostSecret!)}`
				: `${protocol}//${globalThis.location.host}/api/games/${gameId}/ws`;

		const ws = new WebSocket(wsUrl);
		wsReference.current = ws;

		ws.addEventListener('open', () => {
			// Host is pre-authenticated via the URL token - no connect message needed
			// Players must send a connect message for authentication
			if (role === 'player') {
				const connectMessage: ClientMessage = { type: 'connect', role: 'player', gameId, playerId, playerToken };
				ws.send(JSON.stringify(connectMessage));
			}
		});

		ws.addEventListener('message', handleMessage);

		ws.addEventListener('close', (event) => {
			setIsConnected(false);

			// Attempt reconnection for unexpected closures
			if (event.code !== 1000 && event.code < 4000) {
				// Keep isConnecting true to show loading state during reconnect delay
				setIsConnecting(true);
				setError(undefined);
				reconnectTimeoutReference.current = setTimeout(() => {
					connectReference.current?.();
				}, 2000);
			} else {
				setIsConnecting(false);
			}
		});

		ws.addEventListener('error', () => {
			// Don't set isConnecting here - onclose will handle state management
			// and will decide whether to show loading (reconnecting) or error
			setError('WebSocket connection error');
		});
	}, [gameId, role, hostSecret, playerId, playerToken, handleMessage]);

	// Update ref after connect is defined
	// Update ref after connect is defined
	useLayoutEffect(() => {
		connectReference.current = connect;
	});

	// Connect on mount - use empty deps to run only once
	useEffect(() => {
		// Skip connection if no gameId provided
		if (!gameId) {
			return;
		}

		connectReference.current?.();

		return () => {
			if (reconnectTimeoutReference.current) {
				clearTimeout(reconnectTimeoutReference.current);
			}
			if (wsReference.current) {
				wsReference.current.close(1000, 'Component unmounted');
			}
		};
	}, [gameId]);

	// Send message helper
	const sendMessage = useCallback((message: ClientMessage) => {
		if (wsReference.current?.readyState === WebSocket.OPEN) {
			wsReference.current.send(JSON.stringify(message));
		}
	}, []);

	// Player actions
	const join = useCallback(
		(nickname: string) => {
			sendMessage({ type: 'join', nickname });
		},
		[sendMessage],
	);

	const submitAnswer = useCallback(
		(answerIndex: number) => {
			if (submittedAnswer !== undefined) return; // Prevent double submission
			Sentry.startSpan({ op: 'game.action', name: 'Submit Answer' }, () => {
				sendMessage({ type: 'submitAnswer', answerIndex });
			});
		},
		[sendMessage, submittedAnswer],
	);

	// Host actions
	const startGame = useCallback(() => {
		Sentry.startSpan({ op: 'game.action', name: 'Start Game' }, () => {
			sendMessage({ type: 'startGame' });
		});
	}, [sendMessage]);

	const nextState = useCallback(() => {
		sendMessage({ type: 'nextState' });
	}, [sendMessage]);

	// Player emoji action
	const sendEmoji = useCallback(
		(emoji: EmojiReaction) => {
			sendMessage({ type: 'sendEmoji', emoji });
		},
		[sendMessage],
	);

	return {
		isConnected,
		isConnecting,
		error,
		gameState,
		submittedAnswer,
		// Player actions
		join,
		submitAnswer,
		sendEmoji,
		// Host actions
		startGame,
		nextState,
	};
}
