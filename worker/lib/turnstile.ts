import { env } from 'cloudflare:workers';
import { z } from 'zod'; // Import Zod

import type { Context } from 'hono';

const turnstileResponseSchema = z.object({
	success: z.boolean(),
	'error-codes': z.array(z.string()).optional(),
	challenge_ts: z.string().optional(),
	hostname: z.string().optional(),
});

export async function validateTurnstile(c: Context<{ Bindings: never }>, token: string | null | undefined): Promise<Response | undefined> {
	// Skip validation in development
	if (import.meta.env.DEV) {
		return undefined;
	}

	if (!token) {
		return c.json({ success: false, error: 'Turnstile verification required' }, 400);
	}

	const ip = c.req.header('CF-Connecting-IP') ?? 'unknown';

	try {
		const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				secret: env.TURNSTILE_SECRET_KEY,
				response: token,
				remoteip: ip,
			}),
		});

		const data: unknown = await response.json();
		const result = turnstileResponseSchema.safeParse(data);

		if (!result.success || !result.data.success) {
			console.error('[Turnstile Validation Failed]', result.success ? result.data['error-codes'] : result.error);
			return c.json({ success: false, error: 'Turnstile verification failed' }, 403);
		}

		return undefined;
	} catch (error) {
		console.error('[Turnstile Validation Error]', error);
		return c.json({ success: false, error: 'Turnstile verification error' }, 500);
	}
}

/**
 * Extract Turnstile token from request body or header.
 */
export function getTurnstileToken(c: Context): string | undefined {
	return c.req.header('X-Turnstile-Token');
}
