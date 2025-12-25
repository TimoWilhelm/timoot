import { Hono } from 'hono';
import { quizRoutes, gameRoutes, imageRoutes, syncRoutes } from './routes';

/**
 * Compose all API routes with RPC-compatible type inference.
 * Routes are organized by resource in separate modules under ./routes/
 */
const apiRoutes = new Hono<{ Bindings: Env }>().route('', quizRoutes).route('', gameRoutes).route('', imageRoutes).route('', syncRoutes);

/**
 * Register all user-facing API routes on the main app.
 */
export function userRoutes(app: Hono<{ Bindings: Env }>) {
	app.route('', apiRoutes);
}

/**
 * Export the API type for Hono RPC client usage.
 */
export type ApiRoutes = typeof apiRoutes;
