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
	} catch (err) {
		console.error('Failed to send message:', err);
	}
}

/**
 * Broadcast a message to all authenticated WebSocket connections.
 */
function broadcastToAll(ctx: BroadcastContext, message: ServerMessage): void {
	const sockets = ctx.getWebSockets();
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
export function broadcastToRole(ctx: BroadcastContext, role: ClientRole, message: ServerMessage): void {
	const sockets = ctx.getWebSockets();
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
export function getReadyCountdownMs(env: Env): number {
	return parseInt(env.GET_READY_COUNTDOWN_MS, 10);
}

/**
 * Broadcast lobby update to all connected clients.
 */
export function broadcastLobbyUpdate(ctx: BroadcastContext, state: GameState): void {
	broadcastToAll(ctx, buildLobbyMessage(state));
}

/**
 * Broadcast get ready message to all clients.
 */
export function broadcastGetReady(ctx: BroadcastContext, state: GameState): void {
	broadcastToAll(ctx, buildGetReadyMessage(state, getReadyCountdownMs(ctx.env)));
}

/**
 * Broadcast question modifier message to all clients.
 */
export function broadcastQuestionModifier(ctx: BroadcastContext, state: GameState): void {
	broadcastToAll(ctx, buildQuestionModifierMessage(state));
}

/**
 * Broadcast question start message to all clients.
 */
export function broadcastQuestionStart(ctx: BroadcastContext, state: GameState): void {
	broadcastToAll(ctx, buildQuestionMessage(state));
}

/**
 * Broadcast reveal message with appropriate data for each role.
 */
export function broadcastReveal(ctx: BroadcastContext, state: GameState): void {
	// Send to host (no player-specific result)
	broadcastToRole(ctx, 'host', buildRevealMessage(state));

	// Send to each player with their individual result
	const sockets = ctx.getWebSockets();
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
export function broadcastLeaderboard(ctx: BroadcastContext, state: GameState): void {
	broadcastToAll(ctx, buildLeaderboardMessage(state));
}

/**
 * Broadcast game end message to all clients.
 */
export function broadcastGameEnd(ctx: BroadcastContext, state: GameState, revealed: boolean): void {
	broadcastToAll(ctx, buildGameEndMessage(state, revealed));
}
