/**
 * Type-safe SSE client helper for consuming Server-Sent Events streams.
 *
 * Works with Hono's streamSSE helper and provides type-safe event parsing.
 */

export interface SSECallbacks<T extends { event: string; data: unknown }> {
	onEvent: (event: T) => void;
	onError?: (error: Error) => void;
}

/**
 * Parse and consume an SSE stream from a fetch Response with type safety.
 * Works with Hono's `streamSSE` helper on the server side.
 *
 * @example
 * ```ts
 * // Define your SSE event types
 * type MySSEEvent =
 *   | { event: 'progress'; data: { percent: number } }
 *   | { event: 'complete'; data: { result: string } }
 *   | { event: 'error'; data: { message: string } };
 *
 * // Use with Hono RPC client response
 * const response = await client.api.stream.$post({ json: { ... } });
 * await consumeSSEStream<MySSEEvent>(response, {
 *   onEvent: (event) => {
 *     if (event.event === 'progress') {
 *       console.log(event.data.percent); // fully typed
 *     }
 *   },
 * });
 * ```
 */
export async function consumeSSEStream<T extends { event: string; data: unknown }>(
	response: Response,
	callbacks: SSECallbacks<T>,
): Promise<void> {
	if (!response.ok || !response.body) {
		throw new Error(`SSE stream failed: ${response.status} ${response.statusText}`);
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = '';

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split('\n');
			buffer = lines.pop() || '';

			let currentEvent = '';
			for (const line of lines) {
				if (line.startsWith('event: ')) {
					currentEvent = line.slice(7);
				} else if (line.startsWith('data: ')) {
					if (currentEvent) {
						try {
							const data = JSON.parse(line.slice(6)) as T['data'];
							callbacks.onEvent({ event: currentEvent, data } as T);
						} catch {
							callbacks.onError?.(new Error(`Failed to parse SSE data: ${line.slice(6)}`));
						}
					}
					currentEvent = '';
				}
			}
		}
	} finally {
		reader.releaseLock();
	}
}
