import path from 'node:path';

import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for integration tests.
 *
 * These tests run against a live server instance (local or remote).
 *
 * Environment Variables:
 * - TEST_BASE_URL: Target server URL (default: http://localhost:3000)
 */
export default defineConfig(({ mode }) => {
	const environment = loadEnv(mode, process.cwd(), '');
	return {
		test: {
			include: ['test/integration/**/*.test.ts'],
			exclude: ['test/integration/utils/**'],
			globals: true,
			testTimeout: 60_000,
			hookTimeout: 30_000,
			pool: 'threads',
			poolOptions: {
				threads: {
					singleThread: true, // Run tests sequentially to avoid port conflicts
				},
			},
			reporters: ['default'],
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
