import * as path from 'node:path';
import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';

/**
 * Vitest configuration for load tests only.
 *
 * These tests run against a live server instance (local or remote).
 *
 * Environment Variables:
 * - TEST_BASE_URL: Target server URL (default: http://localhost:3000)
 * - RUN_LOAD_TESTS: Set to 'true' to enable load tests
 * - LOAD_TEST_PLAYERS: Number of players per game (default: 20)
 * - LOAD_TEST_CONCURRENT_GAMES: Number of concurrent games (default: 3)
 * - LOAD_TEST_EMOJI_BURST: Emojis per player during burst test (default: 5)
 */
export default defineConfig(({ mode }) => {
	const environment = loadEnv(mode, process.cwd(), '');
	return {
		test: {
			include: ['test/load/**/*.test.ts'],
			globals: true,
			testTimeout: 60_000,
			hookTimeout: 30_000,
			pool: 'threads',
			poolOptions: {
				threads: {
					singleThread: true, // Run tests sequentially to avoid port conflicts
				},
			},
			reporters: ['verbose'],
			env: {
				// Default values - can be overridden via .env or CLI
				TEST_BASE_URL: environment.TEST_BASE_URL || 'http://localhost:3000',
			},
		},
		resolve: {
			alias: {
				'@': path.resolve(__dirname, './src'),
				'@shared': path.resolve(__dirname, './shared'),
			},
		},
	};
});
