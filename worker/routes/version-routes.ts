import { env } from 'cloudflare:workers';
import { Hono } from 'hono';

export const versionRoutes = new Hono<{ Bindings: never }>().get('/api/version', (c) => {
	return c.json({
		success: true,
		data: { release: env.CF_VERSION_METADATA?.id },
	});
});
