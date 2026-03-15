import type { ApiResponse } from '@shared/types';
import type { Context, TypedResponse } from 'hono';

const encoder = new TextEncoder();

/**
 * Constant-time string comparison to prevent timing side-channel attacks.
 * Uses crypto.subtle.timingSafeEqual under the hood.
 * Returns false if either value is empty or if lengths differ.
 */
export function timingSafeEqual(a: string, b: string): boolean {
	if (a.length === 0 || b.length === 0) {
		return false;
	}

	const bufA = encoder.encode(a);
	const bufB = encoder.encode(b);

	if (bufA.byteLength !== bufB.byteLength) {
		return false;
	}

	return crypto.subtle.timingSafeEqual(bufA, bufB);
}

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
	c: Context<{ Bindings: never }>,
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
