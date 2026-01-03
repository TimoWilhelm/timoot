import {
	buildGameEndMessage,
	buildGetReadyMessage,
	buildLeaderboardMessage,
	buildLobbyMessage,
	buildQuestionMessage,
	buildQuestionModifierMessage,
	buildRevealMessage,
} from '../game';

import type { WebSocketAttachment } from './types';
import type { ClientRole, GameState, ServerMessage } from '@shared/types';

/**
 * Context interface for broadcast operations.
 * Provides access to WebSockets and environment.
 */
export interface BroadcastContext {
	getWebSockets: () => WebSocket[];
	env: Env;
}

/**
 * Send a message to a single WebSocket connection.
 */
export function sendMessage(ws: WebSocket, message: ServerMessage): void {
	try {
		ws.send(JSON.stringify(message));
	} catch (error) {
		console.error('Failed to send message:', error);
	}
}

/**
 * Broadcast a message to all authenticated WebSocket connections.
 */
function broadcastToAll(context: BroadcastContext, message: ServerMessage): void {
	const sockets = context.getWebSockets();
	for (const ws of sockets) {
		const attachment = ws.deserializeAttachment() as WebSocketAttachment | null;
		if (attachment?.authenticated) {
			sendMessage(ws, message);
		}
	}
}

/**
 * Broadcast a message to all authenticated WebSocket connections with a specific role.
 */
export function broadcastToRole(context: BroadcastContext, role: ClientRole, message: ServerMessage): void {
	const sockets = context.getWebSockets();
	for (const ws of sockets) {
		const attachment = ws.deserializeAttachment() as WebSocketAttachment | null;
		if (attachment?.authenticated && attachment.role === role) {
			sendMessage(ws, message);
		}
	}
}

/**
 * Get the GET_READY countdown duration from environment.
 */
export function getReadyCountdownMs(environment: Env): number {
	return Number.parseInt(environment.GET_READY_COUNTDOWN_MS, 10);
}

/**
 * Broadcast lobby update to all connected clients.
 */
export function broadcastLobbyUpdate(context: BroadcastContext, state: GameState): void {
	broadcastToAll(context, buildLobbyMessage(state));
}

/**
 * Broadcast get ready message to all clients.
 */
export function broadcastGetReady(context: BroadcastContext, state: GameState): void {
	broadcastToAll(context, buildGetReadyMessage(state, getReadyCountdownMs(context.env)));
}

/**
 * Broadcast question modifier message to all clients.
 */
export function broadcastQuestionModifier(context: BroadcastContext, state: GameState): void {
	broadcastToAll(context, buildQuestionModifierMessage(state));
}

/**
 * Broadcast question start message to all clients.
 */
export function broadcastQuestionStart(context: BroadcastContext, state: GameState): void {
	broadcastToAll(context, buildQuestionMessage(state));
}

/**
 * Broadcast reveal message with appropriate data for each role.
 */
export function broadcastReveal(context: BroadcastContext, state: GameState): void {
	// Send to host (no player-specific result)
	broadcastToRole(context, 'host', buildRevealMessage(state));

	// Send to each player with their individual result
	const sockets = context.getWebSockets();
	for (const ws of sockets) {
		const attachment = ws.deserializeAttachment() as WebSocketAttachment | null;
		if (attachment?.authenticated && attachment.role === 'player' && attachment.playerId) {
			sendMessage(ws, buildRevealMessage(state, attachment.playerId));
		}
	}
}

/**
 * Broadcast leaderboard message to all clients.
 */
export function broadcastLeaderboard(context: BroadcastContext, state: GameState): void {
	broadcastToAll(context, buildLeaderboardMessage(state));
}

/**
 * Broadcast game end message to all clients.
 */
export function broadcastGameEnd(context: BroadcastContext, state: GameState, revealed: boolean): void {
	broadcastToAll(context, buildGameEndMessage(state, revealed));
}
