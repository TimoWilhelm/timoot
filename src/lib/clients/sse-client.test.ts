import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { consumeSSEStream } from './sse-client';

const testSchema = z.union([
	z.object({ event: z.literal('status'), data: z.object({ message: z.string() }) }),
	z.object({ event: z.literal('complete'), data: z.object({ id: z.string() }) }),
	z.object({ event: z.literal('error'), data: z.object({ message: z.string() }) }),
]);

type TestEvent = z.infer<typeof testSchema>;

/**
 * Build a Response whose body streams the given string chunks. Each entry in
 * `chunks` is emitted as a separate `reader.read()` result, letting us simulate
 * network chunk boundaries falling at arbitrary points in the SSE stream.
 */
function streamResponse(chunks: string[]): Response {
	const encoder = new TextEncoder();
	const body = new ReadableStream<Uint8Array>({
		start(controller) {
			for (const chunk of chunks) {
				controller.enqueue(encoder.encode(chunk));
			}
			controller.close();
		},
	});
	return new Response(body, { status: 200 });
}

describe('consumeSSEStream', () => {
	it('parses events delivered in a single chunk', async () => {
		const response = streamResponse(['event: complete\ndata: {"id":"quiz-1"}\n\n']);
		const onEvent = vi.fn();

		await consumeSSEStream<TestEvent>(response, testSchema, { onEvent });

		expect(onEvent).toHaveBeenCalledTimes(1);
		expect(onEvent).toHaveBeenCalledWith({ event: 'complete', data: { id: 'quiz-1' } });
	});

	it('parses an event split between the event: and data: lines across chunks', async () => {
		// This is the regression case: `event: complete` arrives in one read and
		// `data: ...` in the next. The parser must retain `currentEvent`.
		const response = streamResponse(['event: complete\n', 'data: {"id":"quiz-1"}\n\n']);
		const onEvent = vi.fn();

		await consumeSSEStream<TestEvent>(response, testSchema, { onEvent });

		expect(onEvent).toHaveBeenCalledTimes(1);
		expect(onEvent).toHaveBeenCalledWith({ event: 'complete', data: { id: 'quiz-1' } });
	});

	it('parses an event split mid-line across many tiny chunks', async () => {
		const full = 'event: complete\ndata: {"id":"quiz-1"}\n\n';
		const response = streamResponse([...full]);
		const onEvent = vi.fn();

		await consumeSSEStream<TestEvent>(response, testSchema, { onEvent });

		expect(onEvent).toHaveBeenCalledTimes(1);
		expect(onEvent).toHaveBeenCalledWith({ event: 'complete', data: { id: 'quiz-1' } });
	});

	it('parses multiple events including across chunk boundaries', async () => {
		const response = streamResponse([
			'event: status\ndata: {"message":"researching"}\n\nevent: status\n',
			'data: {"message":"writing"}\n\nevent: complete\ndata: ',
			'{"id":"quiz-1"}\n\n',
		]);
		const onEvent = vi.fn();

		await consumeSSEStream<TestEvent>(response, testSchema, { onEvent });

		expect(onEvent).toHaveBeenNthCalledWith(1, { event: 'status', data: { message: 'researching' } });
		expect(onEvent).toHaveBeenNthCalledWith(2, { event: 'status', data: { message: 'writing' } });
		expect(onEvent).toHaveBeenNthCalledWith(3, { event: 'complete', data: { id: 'quiz-1' } });
		expect(onEvent).toHaveBeenCalledTimes(3);
	});

	it('flushes a final event that is not newline-terminated', async () => {
		const response = streamResponse(['event: complete\ndata: {"id":"quiz-1"}']);
		const onEvent = vi.fn();

		await consumeSSEStream<TestEvent>(response, testSchema, { onEvent });

		expect(onEvent).toHaveBeenCalledTimes(1);
		expect(onEvent).toHaveBeenCalledWith({ event: 'complete', data: { id: 'quiz-1' } });
	});

	it('reports parse errors via onError without throwing', async () => {
		const response = streamResponse(['event: complete\ndata: not-json\n\n']);
		const onEvent = vi.fn();
		const onError = vi.fn();

		await consumeSSEStream<TestEvent>(response, testSchema, { onEvent, onError });

		expect(onEvent).not.toHaveBeenCalled();
		expect(onError).toHaveBeenCalledTimes(1);
	});

	it('throws when the response is not ok', async () => {
		const response = new Response(undefined, { status: 500, statusText: 'Internal Server Error' });

		await expect(consumeSSEStream<TestEvent>(response, testSchema, { onEvent: vi.fn() })).rejects.toThrow();
	});
});
