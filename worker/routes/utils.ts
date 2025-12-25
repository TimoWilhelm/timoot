import type { Context } from 'hono';

/**
 * Rate limiter interface matching Cloudflare's Rate Limiting API
 */
interface RateLimiter {
	limit(options: { key: string }): Promise<{ success: boolean }>;
}

/**
 * Check rate limit and return 429 response if exceeded.
 * Uses CF-Connecting-IP combined with endpoint path as the rate limit key.
 * Rate limiting is disabled in development mode.
 */
export async function checkRateLimit(c: Context<{ Bindings: Env }>, rateLimiter: RateLimiter, endpoint: string): Promise<Response | null> {
	if (import.meta.env.DEV) {
		return null;
	}

	const ip = c.req.header('CF-Connecting-IP') ?? 'unknown';
	const key = `${ip}:${endpoint}`;

	const { success } = await rateLimiter.limit({ key });

	if (!success) {
		return c.json(
			{
				success: false,
				error: 'Rate limit exceeded. Please try again later.',
			},
			429,
		);
	}

	return null;
}
