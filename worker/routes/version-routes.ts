import { Hono } from 'hono';

export const versionRoutes = new Hono<{ Bindings: Env }>().get('/api/version', (c) => {
	return c.json({
		success: true,
		data: { release: c.env.CF_VERSION_METADATA?.id },
	});
});
