import { hc } from 'hono/client';
import type { ApiRoutes } from '../../worker/user-routes';

/**
 * Type-safe Hono RPC client for API calls.
 *
 * Usage:
 * ```ts
 * // For routes requiring user ID header:
 * const res = await api.api.quizzes.custom.$get({}, {
 *   headers: userHeaders(userId)
 * });
 *
 * // For protected routes requiring turnstile token:
 * const res = await api.api.games.$post({
 *   json: { quizId: '...' }
 * }, {
 *   headers: protectedHeaders(userId, token)
 * });
 * ```
 */
export const api = hc<ApiRoutes>('/');

/**
 * Helper to create headers for routes requiring user ID.
 */
export function userHeaders(userId: string) {
	return {
		'x-user-id': userId,
	} as const;
}

/**
 * Helper to create headers for protected routes (expensive operations).
 * These routes require both user ID and turnstile token.
 * Resets the token after use via the provided callback.
 */
export function protectedHeaders(userId: string, turnstileToken: string, resetToken?: () => void) {
	// Reset token after creating headers (will be used in the request)
	if (resetToken) {
		setTimeout(resetToken, 0);
	}
	return {
		'x-user-id': userId,
		'x-turnstile-token': turnstileToken,
	} as const;
}

/**
 * Type for inferring request/response types from the API client.
 */
export type { InferRequestType, InferResponseType } from 'hono/client';
