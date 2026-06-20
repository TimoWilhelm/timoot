/**
 * Type-safe SSE client helper for consuming Server-Sent Events streams.
 *
 * Works with Hono's streamSSE helper and provides type-safe event parsing.
 */

import type { z } from 'zod';

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
 * await consumeSSEStream(response, mySSESchema, {
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
	schema: z.ZodType<T>,
	callbacks: SSECallbacks<T>,
): Promise<void> {
	if (!response.ok || !response.body) {
		throw new Error(`SSE stream failed: ${response.status} ${response.statusText}`);
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = '';

	// `currentEvent` must persist across reads: an SSE event is sent as two
	// lines (`event: ...` then `data: ...`), and a network chunk boundary can
	// fall between them. Resetting it on every read would silently drop the
	// `data:` line — and with it events like `complete`.
	let currentEvent = '';

	const processLine = (line: string) => {
		if (line.startsWith('event: ')) {
			currentEvent = line.slice(7);
		} else if (line.startsWith('data: ')) {
			if (currentEvent) {
				try {
					const data: unknown = JSON.parse(line.slice(6));
					const event = schema.parse({ event: currentEvent, data });
					callbacks.onEvent(event);
				} catch (error) {
					callbacks.onError?.(error instanceof Error ? error : new Error(`Failed to parse SSE data: ${line.slice(6)}`));
				}
			}
			currentEvent = '';
		}
	};

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split('\n');
			buffer = lines.pop() || '';

			for (const line of lines) {
				processLine(line);
			}
		}

		// Flush any remaining buffered content once the stream closes, in case
		// the final event was not newline-terminated before the stream ended.
		buffer += decoder.decode();
		if (buffer.length > 0) {
			for (const line of buffer.split('\n')) {
				processLine(line);
			}
		}
	} finally {
		reader.releaseLock();
	}
}
