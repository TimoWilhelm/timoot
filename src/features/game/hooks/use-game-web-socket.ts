import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { Sentry } from '@/lib/sentry';
import { SILENT_ERROR_CODES, type ErrorCodeType } from '@shared/errors';
import { createMachine } from '@shared/fsm';
import { parseServerMessage, serializeMessage, type ParsedServerMessage } from '@shared/ws-messages';

import type { ClientMessage, ClientRole, EmojiReaction, GamePhase, QuestionModifier } from '@shared/types';

// Connection state machine
export type ConnectionState = 'idle' | 'connecting' | 'connected' | 'disconnected';
type ConnectionEvent = 'CONNECT' | 'CONNECTED' | 'DISCONNECTED' | 'RECONNECT';

const connectionMachine = createMachine<ConnectionState, ConnectionEvent>({
	idle: { CONNECT: 'connecting' },
	connecting: { CONNECTED: 'connected', DISCONNECTED: 'disconnected' },
	connected: { DISCONNECTED: 'disconnected' },
	disconnected: { RECONNECT: 'connecting' },
});

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
	/** Monotonically increasing version number from the server. Sent back with nextState to prevent stale transitions. */
	phaseVersion: number;
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
	onKicked?: (reason: string) => void;
}

const initialGameState: WebSocketGameState = {
	phase: 'LOBBY',
	phaseVersion: 0,
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
	onKicked,
}: UseGameWebSocketOptions) {
	const wsReference = useRef<WebSocket | undefined>(undefined);
	const reconnectTimeoutReference = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const [connectionState, setConnectionState] = useState<ConnectionState>(() => (gameId ? 'connecting' : 'idle'));
	const [error, setError] = useState<string | undefined>();
	const [gameState, setGameState] = useState<WebSocketGameState>(initialGameState);
	const [submittedAnswer, setSubmittedAnswer] = useState<number | undefined>();
	const [isAdvancing, setIsAdvancing] = useState(false);

	const handleMessage = useCallback(
		(event: MessageEvent) => {
			const parseResult = parseServerMessage(event.data);
			if (!parseResult.success) {
				console.error('Invalid server message:', parseResult.error);
				Sentry.captureException(new Error('Invalid WebSocket message'), {
					tags: { source: 'websocket' },
					extra: { error: parseResult.error },
				});
				return;
			}
			const message: ParsedServerMessage = parseResult.data;

			switch (message.type) {
				case 'connected': {
					setConnectionState((s) => connectionMachine.transition(s, 'CONNECTED'));
					setError(undefined);
					onConnected?.(message.playerId, message.playerToken);
					break;
				}

				case 'error': {
					setIsAdvancing(false);
					// Only surface unexpected errors — silent errors are harmless race conditions
					if (SILENT_ERROR_CODES.has(message.code)) break;
					setError(message.message);
					onError?.(message.code, message.message);
					break;
				}

				case 'lobbyUpdate': {
					setGameState((previous) => ({
						...previous,
						phase: 'LOBBY',
						phaseVersion: message.phaseVersion,
						gameId: message.gameId,
						pin: message.pin,
						players: message.players,
					}));
					setIsAdvancing(false);
					break;
				}

				case 'getReady': {
					setGameState((previous) => ({
						...previous,
						phase: 'GET_READY',
						phaseVersion: message.phaseVersion,
						getReadyCountdownMs: message.countdownMs,
						totalQuestions: message.totalQuestions,
					}));
					setIsAdvancing(false);
					break;
				}

				case 'questionModifier': {
					setGameState((previous) => ({
						...previous,
						phase: 'QUESTION_MODIFIER',
						phaseVersion: message.phaseVersion,
						questionIndex: message.questionIndex,
						totalQuestions: message.totalQuestions,
						modifiers: message.modifiers,
					}));
					setIsAdvancing(false);
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
						phaseVersion: message.phaseVersion,
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
					setIsAdvancing(false);
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
						phaseVersion: message.phaseVersion,
						correctAnswerIndex: message.correctAnswerIndex,
						playerResult: message.playerResult,
						answerCounts: message.answerCounts,
						questionText: message.questionText,
						options: message.options,
					}));
					setIsAdvancing(false);
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
							phaseVersion: message.phaseVersion,
							leaderboard: enrichedLeaderboard,
							isLastQuestion: message.isLastQuestion,
						};
					});
					setIsAdvancing(false);
					break;
				}

				case 'gameEnd': {
					setGameState((previous) => ({
						...previous,
						phase: message.revealed ? 'END_REVEALED' : 'END_INTRO',
						phaseVersion: message.phaseVersion,
						leaderboard: message.finalLeaderboard,
						endRevealed: message.revealed,
					}));
					setIsAdvancing(false);
					break;
				}

				case 'kicked': {
					setError(message.reason);
					onKicked?.(message.reason);
					wsReference.current?.close();
					break;
				}

				case 'emojiReceived': {
					onEmojiReceived?.(message.emoji, message.playerId);
					break;
				}
			}
		},
		[onConnected, onError, onPlayerJoined, onEmojiReceived, onKicked],
	);

	// Store connect in a ref to enable self-reference for reconnection
	const connectReference = useRef<() => void>(undefined);

	const connect = useCallback(() => {
		// Prevent duplicate connections - check both OPEN and CONNECTING states
		if (wsReference.current?.readyState === WebSocket.OPEN || wsReference.current?.readyState === WebSocket.CONNECTING) return;

		setConnectionState((s) => connectionMachine.transition(s, 'CONNECT'));
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
				ws.send(serializeMessage(connectMessage));
			}
		});

		ws.addEventListener('message', handleMessage);

		ws.addEventListener('close', (event) => {
			// Attempt reconnection for unexpected closures
			if (event.code !== 1000 && event.code < 4000) {
				// Transition to reconnecting state (stays 'connecting' to show loading)
				setConnectionState((s) => connectionMachine.transition(s, 'RECONNECT'));
				setError(undefined);
				reconnectTimeoutReference.current = setTimeout(() => {
					connectReference.current?.();
				}, 2000);
			} else {
				setConnectionState((s) => connectionMachine.transition(s, 'DISCONNECTED'));
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
			wsReference.current.send(serializeMessage(message));
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
		if (isAdvancing) return; // Prevent duplicate sends while waiting for server response
		setIsAdvancing(true);
		sendMessage({ type: 'nextState', phaseVersion: gameState.phaseVersion });
	}, [sendMessage, gameState.phaseVersion, isAdvancing]);

	// Player emoji action
	const sendEmoji = useCallback(
		(emoji: EmojiReaction) => {
			sendMessage({ type: 'sendEmoji', emoji });
		},
		[sendMessage],
	);

	// Host action: remove player from lobby
	const removePlayer = useCallback(
		(playerId: string) => {
			sendMessage({ type: 'removePlayer', playerId });
		},
		[sendMessage],
	);

	return {
		connectionState,
		error,
		gameState,
		submittedAnswer,
		isAdvancing,
		// Player actions
		join,
		submitAnswer,
		sendEmoji,
		// Host actions
		startGame,
		nextState,
		removePlayer,
	};
}
