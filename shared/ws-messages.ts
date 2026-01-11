/**
 * WebSocket message serialization/parsing utilities.
 * Uses devalue for serialization and Zod for runtime validation.
 */
import * as devalue from 'devalue';
import { z } from 'zod';

import { wsClientMessageSchema, wsServerMessageSchema } from './validation';

import type { ClientMessage, ServerMessage } from './types';

// ============ Types ============

export type ParsedServerMessage = z.infer<typeof wsServerMessageSchema>;
export type ParsedClientMessage = z.infer<typeof wsClientMessageSchema>;

export interface ParseResult<T> {
	success: true;
	data: T;
}

export interface ParseError {
	success: false;
	error: string;
}

export type ParseResultType<T> = ParseResult<T> | ParseError;

// ============ Serialization ============

/**
 * Serialize a message for sending over WebSocket.
 * Uses devalue.stringify for safe serialization of complex types.
 */
export function serializeMessage(message: ClientMessage | ServerMessage): string {
	return devalue.stringify(message);
}

// ============ Parsing ============

/**
 * Parse and validate a server message received by the client.
 */
export function parseServerMessage(data: string): ParseResultType<ParsedServerMessage> {
	try {
		const parsed = devalue.parse(data);
		const result = wsServerMessageSchema.safeParse(parsed);

		if (!result.success) {
			return {
				success: false,
				error: z.prettifyError(result.error),
			};
		}

		return {
			success: true,
			data: result.data,
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Failed to parse message',
		};
	}
}

/**
 * Parse and validate a client message received by the server.
 */
export function parseClientMessage(data: string): ParseResultType<ParsedClientMessage> {
	try {
		const parsed = devalue.parse(data);
		const result = wsClientMessageSchema.safeParse(parsed);

		if (!result.success) {
			return {
				success: false,
				error: z.prettifyError(result.error),
			};
		}

		return {
			success: true,
			data: result.data,
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Failed to parse message',
		};
	}
}
