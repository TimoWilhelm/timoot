import { z } from 'zod';
import type { Context, Next } from 'hono';
import { validateTurnstile, getTurnstileToken } from './turnstile';

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
export async function verifyTurnstile(c: Context<{ Bindings: Env }>, next: Next) {
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
	const headers = c.req.valid('header' as never) as { 'x-user-id': string };
	return headers['x-user-id'];
}
