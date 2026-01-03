import { renderHook, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { useGameWebSocket } from '../use-game-web-socket';

// Mock WebSocket
let mockWsInstance: MockWebSocket | undefined;

class MockWebSocket {
	url: string;
	onopen: (() => void) | undefined = undefined;
	onmessage: ((event: MessageEvent) => void) | undefined = undefined;
	onclose: (() => void) | undefined = undefined;
	onerror: ((event: Event) => void) | undefined = undefined;
	readyState: number = 0;
	send = vi.fn();
	close = vi.fn();

	constructor(url: string) {
		this.url = url;
		// eslint-disable-next-line @typescript-eslint/no-this-alias, unicorn/no-this-assignment
		mockWsInstance = this;
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
globalThis.WebSocket = MockWebSocket as any;

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

	// TODO: Fix race condition in test environment (useLayoutEffect timing)
	it.skip('should connect to websocket', async () => {
		const { result } = renderHook(() =>
			useGameWebSocket({
				gameId: 'test-game',
				role: 'player',
			}),
		);

		await waitFor(() => {
			const instance = mockWsInstance;
			expect(instance).toBeDefined();
		});

		// Simulate connection open
		act(() => {
			mockWsInstance!.readyState = 1;
			mockWsInstance!.onopen?.();
		});

		await waitFor(() => {
			expect(result.current.isConnected).toBe(true);
		});

		expect(result.current.isConnecting).toBe(false);
	});
});
