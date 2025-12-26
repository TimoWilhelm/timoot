import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { protectedHeaderSchema, userIdHeaderSchema, getUserId, verifyTurnstile } from './validators';
import type { ApiResponse } from '@shared/types';

// Sync code types
interface SyncCodeData {
	userId: string;
	createdAt: string;
}

// Generate a short 6-character alphanumeric code (uppercase for readability)
function generateSyncCode(): string {
	const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous: 0, O, I, 1
	let code = '';
	for (let i = 0; i < 6; i++) {
		code += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return code;
}

/**
 * Sync routes with RPC-compatible chained methods.
 */
export const syncRoutes = new Hono<{ Bindings: Env }>()
	// Generate a sync code for the current user (requires turnstile - expensive operation)
	.post('/api/sync/generate', zValidator('header', protectedHeaderSchema), verifyTurnstile, async (c) => {
		const userId = getUserId(c);
		if (userId === 'anonymous') {
			return c.json({ success: false, error: 'Valid user ID required' } satisfies ApiResponse, 400);
		}

		try {
			// Generate a unique sync code (retry if collision)
			let code: string;
			let attempts = 0;
			do {
				code = generateSyncCode();
				const existing = await c.env.KV_SYNC.get(`sync:${code}`);
				if (!existing) break;
				attempts++;
			} while (attempts < 5);

			if (attempts >= 5) {
				return c.json({ success: false, error: 'Failed to generate unique code' } satisfies ApiResponse, 500);
			}

			const syncData: SyncCodeData = {
				userId,
				createdAt: new Date().toISOString(),
			};

			// Store with 15 minute expiration
			await c.env.KV_SYNC.put(`sync:${code}`, JSON.stringify(syncData), {
				expirationTtl: 15 * 60, // 15 minutes
			});

			return c.json({
				success: true,
				data: { code, expiresIn: 15 * 60 },
			} satisfies ApiResponse<{ code: string; expiresIn: number }>);
		} catch (error) {
			console.error('[Sync Code Generation Error]', error);
			return c.json({ success: false, error: 'Failed to generate sync code' } satisfies ApiResponse, 500);
		}
	})

	// Redeem a sync code to get the associated userId (no turnstile - one-time use codes are self-limiting)
	.post(
		'/api/sync/redeem',
		zValidator('header', userIdHeaderSchema),
		zValidator('json', z.object({ code: z.string().length(6).toUpperCase() })),
		async (c) => {
			const { code } = c.req.valid('json');

			try {
				const syncDataStr = await c.env.KV_SYNC.get(`sync:${code}`);
				if (!syncDataStr) {
					return c.json({ success: false, error: 'Sync code not found or expired' } satisfies ApiResponse, 404);
				}

				const syncData = JSON.parse(syncDataStr) as SyncCodeData;

				// Delete the code after use (one-time use)
				await c.env.KV_SYNC.delete(`sync:${code}`);

				return c.json({
					success: true,
					data: { userId: syncData.userId },
				} satisfies ApiResponse<{ userId: string }>);
			} catch (error) {
				console.error('[Sync Code Redemption Error]', error);
				return c.json({ success: false, error: 'Failed to redeem sync code' } satisfies ApiResponse, 500);
			}
		},
	);
