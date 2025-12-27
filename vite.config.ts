import path from 'node:path';
import { defineConfig, UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import devtoolsJson from 'vite-plugin-devtools-json';
import { cloudflare } from '@cloudflare/vite-plugin';
import { sentryVitePlugin } from '@sentry/vite-plugin';

// https://vite.dev/config/
export default (): UserConfig => {
	return defineConfig({
		plugins: [
			devtoolsJson(),
			react(),
			cloudflare(),
			sentryVitePlugin({
				authToken: process.env.SENTRY_AUTH_TOKEN,
				org: 'daxo',
				project: 'timoot',
				telemetry: false,
			}),
		],
		build: {
			sourcemap: true,
			minify: true,
		},
		css: {
			devSourcemap: true,
		},
		resolve: {
			alias: {
				'@': path.resolve(__dirname, './src'),
				'@shared': path.resolve(__dirname, './shared'),
			},
		},
		optimizeDeps: {
			// This is still crucial for reducing the time from when `bun run dev`
			// is executed to when the server is actually ready.
			include: ['react', 'react-dom', 'react-router-dom'],
			force: true,
		},
		// Clear cache more aggressively
		cacheDir: 'node_modules/.vite',
	});
};
