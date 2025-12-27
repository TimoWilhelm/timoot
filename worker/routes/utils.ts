import type { Context, TypedResponse } from 'hono';
import type { ApiResponse } from '@shared/types';

/**
 * Rate limiter interface matching Cloudflare's Rate Limiting API
 */
interface RateLimiter {
	limit(options: { key: string }): Promise<{ success: boolean }>;
}

type RateLimitErrorResponse = TypedResponse<ApiResponse<never>, 429, 'json'>;

/**
 * Check rate limit and return 429 response if exceeded.
 * Uses CF-Connecting-IP combined with endpoint path as the rate limit key.
 * Rate limiting is disabled in development mode.
 */
export async function checkRateLimit(
	c: Context<{ Bindings: Env }>,
	rateLimiter: RateLimiter,
	endpoint: string,
): Promise<RateLimitErrorResponse | undefined> {
	if (import.meta.env.DEV) {
		return undefined;
	}

	const ip = c.req.header('CF-Connecting-IP') ?? 'unknown';
	const key = `${ip}:${endpoint}`;

	const { success } = await rateLimiter.limit({ key });

	if (!success) {
		return c.json(
			{
				success: false,
				error: 'Rate limit exceeded. Please try again later.',
			} satisfies ApiResponse<never>,
			429,
		);
	}

	return undefined;
}
