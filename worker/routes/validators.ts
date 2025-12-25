import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { Context, Next } from 'hono';
import { validateTurnstile, getTurnstileToken } from './turnstile';

/**
 * Header schema for routes requiring user identification
 */
const userIdHeaderSchema = z.object({
	'x-user-id': z.string().min(1, 'User ID is required'),
});

/**
 * Validator for routes requiring user identification
 */
export const withUserId = zValidator('header', userIdHeaderSchema);

/**
 * Header schema for routes requiring turnstile token (expensive operations)
 * In development mode, the turnstile token is optional.
 */
const protectedHeaderSchema = z.object({
	'x-user-id': z.string().min(1, 'User ID is required'),
	'x-turnstile-token': import.meta.env.DEV ? z.string().optional() : z.string().min(1, 'Turnstile token is required'),
});

/**
 * Validator for routes requiring turnstile token
 * Note: This only validates the header is present. Actual turnstile verification
 * is done separately since it requires async validation.
 * In development mode, the turnstile token header is optional.
 */
export const withProtectedHeader = zValidator('header', protectedHeaderSchema);

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
