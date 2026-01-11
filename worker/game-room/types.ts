import { z } from 'zod';

import type { ClientRole } from '@shared/types';

/** WebSocket attachment data stored per connection */
export interface WebSocketAttachment {
	role: ClientRole;
	playerId?: string;
	authenticated: boolean;
}

// Zod schema for runtime validation of WebSocket attachment
const webSocketAttachmentSchema = z.object({
	role: z.enum(['host', 'player']),
	playerId: z.string().optional(),
	authenticated: z.boolean(),
});

/**
 * Type-safe helper to get WebSocket attachment.
 * Uses Zod validation instead of type assertions.
 * Returns null if attachment is missing or invalid.
 */
export function getAttachment(ws: WebSocket): WebSocketAttachment | undefined {
	const raw: unknown = ws.deserializeAttachment();
	const result = webSocketAttachmentSchema.safeParse(raw);
	if (result.success) {
		return result.data;
	}
	return undefined;
}
