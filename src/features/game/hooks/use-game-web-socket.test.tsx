import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { serializeMessage } from '@shared/ws-messages';

import { useGameWebSocket } from './use-game-web-socket';

// Mock WebSocket
let mockWsInstance: MockWebSocket | undefined;

function setMockInstance(instance: MockWebSocket) {
	mockWsInstance = instance;
}

class MockWebSocket {
	static OPEN = 1;
	static CONNECTING = 0;
	url: string;
	readyState: number = 0;
	send = vi.fn();
	close = vi.fn();

	private listeners: Record<string, ((...arguments_: unknown[]) => void)[]> = {};

	constructor(url: string) {
		this.url = url;
		setMockInstance(this);
	}

	addEventListener(event: string, callback: (...arguments_: unknown[]) => void) {
		if (!this.listeners[event]) {
			this.listeners[event] = [];
		}
		this.listeners[event].push(callback);
	}

	// Helper to trigger events in tests
	triggerEvent(event: string, ...arguments_: unknown[]) {
		if (this.listeners[event]) for (const callback of this.listeners[event]) callback(...arguments_);
	}
}

vi.stubGlobal('WebSocket', MockWebSocket);

describe('useGameWebSocket', () => {
	beforeEach(() => {
		mockWsInstance = undefined;
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.clearAllMocks();
	});

	it('should initialize with default state', () => {
		const { result } = renderHook(() =>
			useGameWebSocket({
				gameId: 'test-game',
				role: 'player',
			}),
		);

		expect(result.current.isConnected).toBe(false);
		expect(result.current.isConnecting).toBe(true); // Auto connects
		expect(result.current.gameState.phase).toBe('LOBBY');
	});

	it('should connect to websocket', async () => {
		let result: ReturnType<typeof renderHook<ReturnType<typeof useGameWebSocket>, unknown>>['result'];

		// Wrap renderHook in act to ensure all effects (including useLayoutEffect) run
		await act(async () => {
			const hookResult = renderHook(() =>
				useGameWebSocket({
					gameId: 'test-game',
					role: 'player',
				}),
			);
			result = hookResult.result;
			// Flush microtask queue to allow useLayoutEffect -> useEffect chain to complete
			vi.advanceTimersByTime(0);
		});

		// WebSocket should now be instantiated
		expect(mockWsInstance).toBeDefined();

		// Simulate connection open and server response
		await act(async () => {
			mockWsInstance!.readyState = 1;
			mockWsInstance!.triggerEvent('open');
			// Simulate server sending 'connected' message
			mockWsInstance!.triggerEvent(
				'message',
				new MessageEvent('message', {
					data: serializeMessage({ type: 'connected', role: 'player' }),
				}),
			);
		});

		expect(result!.current.isConnected).toBe(true);
		expect(result!.current.isConnecting).toBe(false);
	});
});
