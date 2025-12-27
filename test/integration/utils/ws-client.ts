import type { ClientMessage, ClientRole, EmojiReaction, ServerMessage } from '@shared/types';

export interface WsClientOptions {
	baseUrl: string;
	gameId: string;
	role: ClientRole;
	hostSecret?: string;
	playerId?: string;
	playerToken?: string;
	timeout?: number;
}

export interface ConnectedResult {
	playerId?: string;
	playerToken?: string;
}

/**
 * WebSocket test client for integration testing.
 * Provides promise-based API for interacting with the game server.
 */
export class WsTestClient {
	private ws: WebSocket | undefined;
	private messageQueue: ServerMessage[] = [];
	private messageHandlers: ((message: ServerMessage) => void)[] = [];
	private closePromise: Promise<{ code: number; reason: string }> | undefined;
	private closeResolve: ((value: { code: number; reason: string }) => void) | undefined;

	public playerId?: string;
	public playerToken?: string;
	public isConnected = false;

	constructor(private options: WsClientOptions) {}

	/**
	 * Connect to the WebSocket server
	 */
	async connect(): Promise<ConnectedResult> {
		const { baseUrl, gameId, role, hostSecret, playerId, playerToken, timeout = 10_000 } = this.options;

		const protocol = baseUrl.startsWith('https') ? 'wss' : 'ws';
		const host = baseUrl.replace(/^https?:\/\//, '');

		const wsUrl =
			role === 'host'
				? `${protocol}://${host}/api/games/${gameId}/host-ws?token=${encodeURIComponent(hostSecret!)}`
				: `${protocol}://${host}/api/games/${gameId}/ws`;

		return new Promise((resolve, reject) => {
			const timeoutId = setTimeout(() => {
				reject(new Error(`Connection timeout after ${timeout}ms`));
				this.ws?.close();
			}, timeout);

			this.ws = new WebSocket(wsUrl);

			this.closePromise = new Promise((resolve) => {
				this.closeResolve = resolve;
			});

			this.ws.addEventListener('open', () => {
				// Players must send connect message
				if (role === 'player') {
					const connectMessage: ClientMessage = { type: 'connect', role: 'player', gameId, playerId, playerToken };
					this.ws!.send(JSON.stringify(connectMessage));
				}
			});

			this.ws.addEventListener('message', (event) => {
				try {
					const message = JSON.parse(event.data.toString()) as ServerMessage;

					// Handle initial connected message specially during connection phase
					// Don't queue this one - it's handled by the connect() promise
					if (message.type === 'connected' && !this.isConnected) {
						clearTimeout(timeoutId);
						this.isConnected = true;
						this.playerId = message.playerId;
						this.playerToken = message.playerToken;
						resolve({ playerId: message.playerId, playerToken: message.playerToken });
						return; // Don't queue initial connected message
					}

					// Queue message and notify handlers
					this.messageQueue.push(message);
					for (const handler of this.messageHandlers) {
						handler(message);
					}
				} catch (error) {
					console.error('Failed to parse message:', error);
				}
			});

			this.ws.addEventListener('error', (error) => {
				clearTimeout(timeoutId);
				reject(new Error(`WebSocket error: ${error}`));
			});

			this.ws.addEventListener('close', (event) => {
				clearTimeout(timeoutId);
				const wasConnected = this.isConnected;
				this.isConnected = false;
				this.closeResolve?.({ code: event.code, reason: event.reason });
				if (!wasConnected) {
					reject(new Error(`WebSocket closed before connected: ${event.code} ${event.reason}`));
				}
			});
		});
	}

	/**
	 * Send a message to the server
	 */
	send(message: ClientMessage): void {
		if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
			throw new Error('WebSocket not connected');
		}
		this.ws.send(JSON.stringify(message));
	}

	/**
	 * Wait for a specific message type
	 */
	async waitForMessage<T extends ServerMessage['type']>(
		type: T,
		timeout = 30_000,
		predicate?: (message: Extract<ServerMessage, { type: T }>) => boolean,
	): Promise<Extract<ServerMessage, { type: T }>> {
		// Check existing queue first
		const existing = this.messageQueue.find(
			(m) => m.type === type && (!predicate || predicate(m as Extract<ServerMessage, { type: T }>)),
		) as Extract<ServerMessage, { type: T }> | undefined;
		if (existing) {
			return existing;
		}

		return new Promise((resolve, reject) => {
			const timeoutId = setTimeout(() => {
				const index = this.messageHandlers.indexOf(handler);
				if (index !== -1) this.messageHandlers.splice(index, 1);
				reject(new Error(`Timeout waiting for message type: ${type}`));
			}, timeout);

			const handler = (message: ServerMessage) => {
				if (message.type === type && (!predicate || predicate(message as Extract<ServerMessage, { type: T }>))) {
					clearTimeout(timeoutId);
					const index = this.messageHandlers.indexOf(handler);
					if (index !== -1) this.messageHandlers.splice(index, 1);
					resolve(message as Extract<ServerMessage, { type: T }>);
				}
			};

			this.messageHandlers.push(handler);
		});
	}

	/**
	 * Get all received messages
	 */
	getMessages(): ServerMessage[] {
		return [...this.messageQueue];
	}

	/**
	 * Get messages of a specific type
	 */
	getMessagesByType<T extends ServerMessage['type']>(type: T): Extract<ServerMessage, { type: T }>[] {
		return this.messageQueue.filter((m) => m.type === type) as Extract<ServerMessage, { type: T }>[];
	}

	/**
	 * Clear the message queue
	 */
	clearMessages(): void {
		this.messageQueue = [];
	}

	/**
	 * Close the WebSocket connection
	 */
	close(code = 1000, reason = 'Test completed'): void {
		this.ws?.close(code, reason);
	}

	/**
	 * Wait for the connection to close
	 */
	async waitForClose(): Promise<{ code: number; reason: string }> {
		if (!this.closePromise) {
			return { code: 1000, reason: 'Already closed' };
		}
		return this.closePromise;
	}

	// ============ Player Actions ============

	/**
	 * Join a game with a nickname (fire and forget - doesn't wait for confirmation).
	 * Use joinAndWait() if you need to wait for confirmation.
	 */
	join(nickname: string): void {
		this.send({ type: 'join', nickname });
	}

	/**
	 * Join a game and wait for the connected response with credentials.
	 */
	async joinAndWait(nickname: string, timeout = 10_000): Promise<ConnectedResult> {
		this.send({ type: 'join', nickname });

		// Wait for connected message with playerId (server sends this after successful join)
		try {
			const message = await this.waitForMessage('connected', timeout, (m) => !!m.playerId);
			this.playerId = message.playerId;
			this.playerToken = message.playerToken;
			return { playerId: message.playerId, playerToken: message.playerToken };
		} catch {
			// If timeout, check if credentials arrived in queue anyway
			const connectedMessage = this.messageQueue.find((m) => m.type === 'connected' && 'playerId' in m && m.playerId) as
				| Extract<ServerMessage, { type: 'connected' }>
				| undefined;

			if (connectedMessage) {
				this.playerId = connectedMessage.playerId;
				this.playerToken = connectedMessage.playerToken;
				return { playerId: connectedMessage.playerId, playerToken: connectedMessage.playerToken };
			}
			return { playerId: undefined, playerToken: undefined };
		}
	}

	/**
	 * Submit an answer
	 */
	async submitAnswer(answerIndex: number): Promise<void> {
		this.send({ type: 'submitAnswer', answerIndex });
		await this.waitForMessage('answerReceived');
	}

	/**
	 * Send an emoji reaction
	 */
	sendEmoji(emoji: EmojiReaction): void {
		this.send({ type: 'sendEmoji', emoji });
	}

	// ============ Host Actions ============

	/**
	 * Start the game
	 */
	async startGame(): Promise<void> {
		this.send({ type: 'startGame' });
		await this.waitForMessage('getReady');
	}

	/**
	 * Advance to next state
	 */
	nextState(): void {
		this.send({ type: 'nextState' });
	}
}

interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
}

interface CreateGameResponse {
	id: string;
	hostSecret: string;
	pin: string;
}

/**
 * Create a game via the API
 */
export async function createGame(baseUrl: string, quizId?: string): Promise<{ gameId: string; hostSecret: string; pin: string }> {
	const response = await fetch(`${baseUrl}/api/games`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-user-id': 'test-user-' + Date.now(),
			'x-turnstile-token': 'test-token', // Turnstile validation is skipped in DEV mode
		},
		body: JSON.stringify({ quizId }),
	});

	if (!response.ok) {
		throw new Error(`Failed to create game: ${response.status} ${response.statusText}`);
	}

	const data: ApiResponse<CreateGameResponse> = await response.json();
	if (!data.success || !data.data) {
		throw new Error(`Failed to create game: ${data.error}`);
	}

	return {
		gameId: data.data.id,
		hostSecret: data.data.hostSecret,
		pin: data.data.pin,
	};
}

/**
 * Generate unique player names for testing (max 20 chars to pass validation)
 */
export function generatePlayerNames(count: number, prefix = 'P'): string[] {
	const suffix = Date.now().toString().slice(-6); // Last 6 digits of timestamp
	return Array.from({ length: count }, (_, index) => `${prefix}${index + 1}_${suffix}`);
}
