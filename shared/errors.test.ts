import { describe, expect, it } from 'vitest';

import { ErrorCode, createError } from './errors';

import type { ErrorCodeType } from './errors';

describe('errors.ts', () => {
	describe('ErrorCode', () => {
		it('has all expected game state error codes', () => {
			expect(ErrorCode.GAME_NOT_FOUND).toBe('GAME_NOT_FOUND');
			expect(ErrorCode.GAME_ALREADY_STARTED).toBe('GAME_ALREADY_STARTED');
			expect(ErrorCode.GAME_NOT_IN_LOBBY).toBe('GAME_NOT_IN_LOBBY');
			expect(ErrorCode.INVALID_STATE_TRANSITION).toBe('INVALID_STATE_TRANSITION');
		});

		it('has all expected authentication error codes', () => {
			expect(ErrorCode.INVALID_SESSION_TOKEN).toBe('INVALID_SESSION_TOKEN');
			expect(ErrorCode.HOST_ALREADY_AUTHENTICATED).toBe('HOST_ALREADY_AUTHENTICATED');
			expect(ErrorCode.NOT_AUTHENTICATED).toBe('NOT_AUTHENTICATED');
			expect(ErrorCode.HOST_ENDPOINT_REQUIRED).toBe('HOST_ENDPOINT_REQUIRED');
		});

		it('has all expected permission error codes', () => {
			expect(ErrorCode.ONLY_PLAYERS_CAN_JOIN).toBe('ONLY_PLAYERS_CAN_JOIN');
			expect(ErrorCode.ONLY_HOST_CAN_START).toBe('ONLY_HOST_CAN_START');
			expect(ErrorCode.ONLY_HOST_CAN_ADVANCE).toBe('ONLY_HOST_CAN_ADVANCE');
			expect(ErrorCode.ONLY_PLAYERS_CAN_ANSWER).toBe('ONLY_PLAYERS_CAN_ANSWER');
			expect(ErrorCode.ONLY_PLAYERS_CAN_SEND_EMOJI).toBe('ONLY_PLAYERS_CAN_SEND_EMOJI');
		});

		it('has all expected player action error codes', () => {
			expect(ErrorCode.GAME_FULL).toBe('GAME_FULL');
			expect(ErrorCode.ALREADY_JOINED).toBe('ALREADY_JOINED');
			expect(ErrorCode.NICKNAME_TAKEN).toBe('NICKNAME_TAKEN');
			expect(ErrorCode.ALREADY_ANSWERED).toBe('ALREADY_ANSWERED');
			expect(ErrorCode.TIME_EXPIRED).toBe('TIME_EXPIRED');
			expect(ErrorCode.INVALID_ANSWER_INDEX).toBe('INVALID_ANSWER_INDEX');
			expect(ErrorCode.NOT_IN_QUESTION_PHASE).toBe('NOT_IN_QUESTION_PHASE');
		});

		it('has all expected message error codes', () => {
			expect(ErrorCode.UNKNOWN_MESSAGE_TYPE).toBe('UNKNOWN_MESSAGE_TYPE');
			expect(ErrorCode.INVALID_MESSAGE_FORMAT).toBe('INVALID_MESSAGE_FORMAT');
			expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
		});

		it('all error codes are unique', () => {
			const values = Object.values(ErrorCode);
			const uniqueValues = new Set(values);
			expect(values.length).toBe(uniqueValues.size);
		});
	});

	describe('createError', () => {
		it('creates error with code and default message', () => {
			const error = createError(ErrorCode.GAME_NOT_FOUND);
			expect(error.code).toBe('GAME_NOT_FOUND');
			expect(error.message).toBe('Game not found');
		});

		it('creates error with custom message', () => {
			const error = createError(ErrorCode.GAME_NOT_FOUND, 'Custom error message');
			expect(error.code).toBe('GAME_NOT_FOUND');
			expect(error.message).toBe('Custom error message');
		});

		it('creates error for all error types', () => {
			const errorCodes: ErrorCodeType[] = Object.values(ErrorCode);

			for (const code of errorCodes) {
				const error = createError(code);
				expect(error.code).toBe(code);
				expect(typeof error.message).toBe('string');
				expect(error.message.length).toBeGreaterThan(0);
			}
		});

		it('includes code in returned object', () => {
			const error = createError(ErrorCode.NICKNAME_TAKEN);
			expect(error).toHaveProperty('code');
			expect(error).toHaveProperty('message');
		});

		it('works with authentication errors', () => {
			const error = createError(ErrorCode.NOT_AUTHENTICATED);
			expect(error.code).toBe('NOT_AUTHENTICATED');
			expect(error.message).toBe('Not authenticated. Send connect message first.');
		});

		it('works with permission errors', () => {
			const error = createError(ErrorCode.ONLY_HOST_CAN_START);
			expect(error.code).toBe('ONLY_HOST_CAN_START');
			expect(error.message).toBe('Only host can start the game');
		});

		it('works with player action errors', () => {
			const error = createError(ErrorCode.TIME_EXPIRED);
			expect(error.code).toBe('TIME_EXPIRED');
			expect(error.message).toBe('Time is up');
		});
	});
});
