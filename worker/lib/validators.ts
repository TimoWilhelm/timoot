import { z } from 'zod';

import { validateTurnstile, getTurnstileToken } from './turnstile';

import type { Context, Next } from 'hono';

/**
 * Header schema for routes requiring user identification
 */
export const userIdHeaderSchema = z.object({
	'x-user-id': z.string().min(1, 'User ID is required'),
});

/**
 * Header schema for routes requiring turnstile token (expensive operations)
 * In development mode, the turnstile token is optional.
 */
export const protectedHeaderSchema = z.object({
	'x-user-id': z.string().min(1, 'User ID is required'),
	'x-turnstile-token': import.meta.env.DEV ? z.string().optional() : z.string().min(1, 'Turnstile token is required'),
});

/**
 * Middleware to verify turnstile token for protected routes.
 * Use after withProtectedHeader to get the token and verify it.
 */
export async function verifyTurnstile(c: Context<{ Bindings: never }>, next: Next) {
	const turnstileResponse = await validateTurnstile(c, getTurnstileToken(c));
	if (turnstileResponse) {
		return turnstileResponse;
	}
	await next();
}

/**
 * Get user ID from validated headers
 */
export function getUserId(c: Context): string {
	const userId = c.req.header('x-user-id');
	if (!userId) {
		// Should not happen if validation middleware is used, but safe to throw or handle
		throw new Error('User ID header missing in protected route');
	}
	return userId;
}
