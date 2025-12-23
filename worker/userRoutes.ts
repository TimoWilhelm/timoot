import { Hono } from 'hono';
import { registerGameRoutes, registerImageRoutes, registerQuizRoutes, registerSyncRoutes } from './routes';

/**
 * Register all user-facing API routes.
 * Routes are organized by resource in separate modules under ./routes/
 */
export function userRoutes(app: Hono<{ Bindings: Env }>) {
	registerQuizRoutes(app);
	registerGameRoutes(app);
	registerImageRoutes(app);
	registerSyncRoutes(app);
}
