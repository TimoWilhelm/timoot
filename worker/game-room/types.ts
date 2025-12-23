import type { ClientRole } from '@shared/types';

/** WebSocket attachment data stored per connection */
export interface WebSocketAttachment {
	role: ClientRole;
	playerId?: string;
	authenticated: boolean;
}
