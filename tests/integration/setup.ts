/**
 * Setup file for integration tests.
 * Polyfills WebSocket for Node.js environments.
 */
import { WebSocket } from 'ws';

// WebSocket polyfill for Node.js/vitest threads
if (typeof globalThis.WebSocket === 'undefined') {
	(globalThis as any).WebSocket = WebSocket;
}

export {};
