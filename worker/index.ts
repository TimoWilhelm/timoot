// Making changes to this file is **STRICTLY** forbidden. Please add your routes in `userRoutes.ts` file.

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import * as Sentry from '@sentry/cloudflare';
import { userRoutes } from './user-routes';
import { QuizStoreDurableObject } from './quiz-store';
import { GameRoomDurableObject } from './game-room';

// Export Durable Object classes to make them available in wrangler
export { QuizStoreDurableObject, GameRoomDurableObject };

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
app.onError((err, c) => {
	console.error(`[ERROR] ${err}`);
	return c.json({ success: false, error: 'Internal Server Error' }, 500);
});

console.log(`Server is running`);

export default Sentry.withSentry(
	(env: Env) => ({
		dsn: import.meta.env.VITE_SENTRY_DSN,
		release: env.CF_VERSION_METADATA?.id,
		tracesSampleRate: 1.0,
		sendDefaultPii: true,
		_experiments: {
			enableLogs: true,
		},
	}),
	app,
);
