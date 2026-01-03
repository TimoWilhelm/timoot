// Making changes to this file is **STRICTLY** forbidden. Please add your routes in `userRoutes.ts` file.

import * as Sentry from '@sentry/cloudflare';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import { userRoutes } from './user-routes';

// Export Durable Object classes to make them available in wrangler

const app = new Hono<{ Bindings: Env }>();

if (import.meta.env.DEV) {
	app.use('*', logger());
}

// **DO NOT TOUCH THE CODE BELOW THIS LINE**
app.use(
	'/api/*',
	cors({ origin: '*', allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowHeaders: ['Content-Type', 'Authorization'] }),
);

userRoutes(app);
app.get('/api/health', (c) => c.json({ success: true, data: { status: 'healthy', timestamp: new Date().toISOString() } }));

app.notFound((c) => c.json({ success: false, error: 'Not Found' }, 404));
app.onError((error, c) => {
	console.error(`[ERROR] ${error}`);
	return c.json({ success: false, error: 'Internal Server Error' }, 500);
});

console.log(`Server is running`);

export default Sentry.withSentry(
	(environment: Env) => ({
		dsn: import.meta.env.VITE_SENTRY_DSN,
		release: environment.CF_VERSION_METADATA?.id,
		tracesSampleRate: 1,
		sendDefaultPii: true,
		_experiments: {
			enableLogs: true,
		},
	}),
	app,
);

export { UserStoreDurableObject } from './durable/user-store';
export { GameRoomDurableObject } from './durable/game-room';
