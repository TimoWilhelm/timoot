import type { Context } from 'hono';

interface TurnstileValidationResponse {
	success: boolean;
	'error-codes'?: string[];
	challenge_ts?: string;
	hostname?: string;
}

/**
 * Validate a Turnstile token server-side.
 * Returns null if valid, or an error Response if invalid.
 */
export async function validateTurnstile(c: Context<{ Bindings: Env }>, token: string | null | undefined): Promise<Response | undefined> {
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
				secret: c.env.TURNSTILE_SECRET_KEY,
				response: token,
				remoteip: ip,
			}),
		});

		const result = (await response.json()) as TurnstileValidationResponse;

		if (!result.success) {
			console.error('[Turnstile Validation Failed]', result['error-codes']);
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
