/**
 * Machine-readable error codes for WebSocket communication.
 * Use these codes for programmatic error handling instead of matching on human-readable messages.
 */
export const ErrorCode = {
	// Game state errors
	GAME_NOT_FOUND: 'GAME_NOT_FOUND',
	GAME_ALREADY_STARTED: 'GAME_ALREADY_STARTED',
	GAME_NOT_IN_LOBBY: 'GAME_NOT_IN_LOBBY',
	INVALID_STATE_TRANSITION: 'INVALID_STATE_TRANSITION',

	// Authentication errors
	INVALID_SESSION_TOKEN: 'INVALID_SESSION_TOKEN',
	HOST_ALREADY_AUTHENTICATED: 'HOST_ALREADY_AUTHENTICATED',
	NOT_AUTHENTICATED: 'NOT_AUTHENTICATED',
	HOST_ENDPOINT_REQUIRED: 'HOST_ENDPOINT_REQUIRED',

	// Permission errors
	ONLY_PLAYERS_CAN_JOIN: 'ONLY_PLAYERS_CAN_JOIN',
	ONLY_HOST_CAN_START: 'ONLY_HOST_CAN_START',
	ONLY_HOST_CAN_ADVANCE: 'ONLY_HOST_CAN_ADVANCE',
	ONLY_PLAYERS_CAN_ANSWER: 'ONLY_PLAYERS_CAN_ANSWER',

	// Player action errors
	GAME_FULL: 'GAME_FULL',
	ALREADY_JOINED: 'ALREADY_JOINED',
	NICKNAME_TAKEN: 'NICKNAME_TAKEN',
	ALREADY_ANSWERED: 'ALREADY_ANSWERED',
	TIME_EXPIRED: 'TIME_EXPIRED',
	INVALID_ANSWER_INDEX: 'INVALID_ANSWER_INDEX',
	NOT_IN_QUESTION_PHASE: 'NOT_IN_QUESTION_PHASE',

	// Message errors
	UNKNOWN_MESSAGE_TYPE: 'UNKNOWN_MESSAGE_TYPE',
	INVALID_MESSAGE_FORMAT: 'INVALID_MESSAGE_FORMAT',
	VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Human-readable messages for each error code.
 * These are for display purposes only - always match on the code, not the message.
 */
export const ErrorMessages: Record<ErrorCodeType, string> = {
	[ErrorCode.GAME_NOT_FOUND]: 'Game not found',
	[ErrorCode.GAME_ALREADY_STARTED]: 'Game has already started',
	[ErrorCode.GAME_NOT_IN_LOBBY]: 'Cannot join - game not in lobby',
	[ErrorCode.INVALID_STATE_TRANSITION]: 'Invalid state transition',

	[ErrorCode.INVALID_SESSION_TOKEN]: 'Your session could not be restored',
	[ErrorCode.HOST_ALREADY_AUTHENTICATED]: 'Host already authenticated',
	[ErrorCode.NOT_AUTHENTICATED]: 'Not authenticated. Send connect message first.',
	[ErrorCode.HOST_ENDPOINT_REQUIRED]: 'Hosts must use the host WebSocket endpoint',

	[ErrorCode.ONLY_PLAYERS_CAN_JOIN]: 'Only players can join',
	[ErrorCode.ONLY_HOST_CAN_START]: 'Only host can start the game',
	[ErrorCode.ONLY_HOST_CAN_ADVANCE]: 'Only host can advance state',
	[ErrorCode.ONLY_PLAYERS_CAN_ANSWER]: 'Only players can submit answers',

	[ErrorCode.GAME_FULL]: 'Game is full',
	[ErrorCode.ALREADY_JOINED]: 'Already joined',
	[ErrorCode.NICKNAME_TAKEN]: 'Nickname already taken',
	[ErrorCode.ALREADY_ANSWERED]: 'Already answered',
	[ErrorCode.TIME_EXPIRED]: 'Time is up',
	[ErrorCode.INVALID_ANSWER_INDEX]: 'Invalid answer index',
	[ErrorCode.NOT_IN_QUESTION_PHASE]: 'Not in question phase',

	[ErrorCode.UNKNOWN_MESSAGE_TYPE]: 'Unknown message type',
	[ErrorCode.INVALID_MESSAGE_FORMAT]: 'Invalid message format',
	[ErrorCode.VALIDATION_ERROR]: 'Validation error',
};

/**
 * Helper to create an error response with both code and message.
 */
export function createError(code: ErrorCodeType, customMessage?: string): { code: ErrorCodeType; message: string } {
	return {
		code,
		message: customMessage ?? ErrorMessages[code],
	};
}
