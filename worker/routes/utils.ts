import type { Context } from 'hono';

/**
 * Shared utilities for route handlers
 */

/**
 * Extract and validate user ID from request header.
 * Returns 'anonymous' for invalid or missing IDs.
 */
export function getUserIdFromRequest(c: { req: { header: (name: string) => string | undefined } }): string {
	const userId = c.req.header('X-User-Id');
	if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
		// Return a default/fallback for invalid IDs (will create isolated storage)
		return 'anonymous';
	}
	return userId;
}

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
