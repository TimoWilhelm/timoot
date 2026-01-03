import path from 'node:path';

import { cloudflare } from '@cloudflare/vite-plugin';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, UserConfig } from 'vite';
import devtoolsJson from 'vite-plugin-devtools-json';

// https://vite.dev/config/
export default function defineViteConfig({ mode }: { mode: string }): UserConfig {
	const environment = loadEnv(mode, process.cwd(), '');
	return defineConfig({
		plugins: [
			devtoolsJson(),
			tailwindcss(),
			react(),
			cloudflare(),
			sentryVitePlugin({
				authToken: environment.SENTRY_AUTH_TOKEN,
				org: 'daxo',
				project: 'timoot',
				telemetry: false,
			}),
		],
		build: {
			sourcemap: true,
			minify: true,
			target: 'ES2023',
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
}
