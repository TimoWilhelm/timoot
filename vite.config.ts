import path from 'node:path';

import { cloudflare } from '@cloudflare/vite-plugin';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, UserConfig } from 'vite';
import devtoolsJson from 'vite-plugin-devtools-json';
import { VitePWA } from 'vite-plugin-pwa';

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
			VitePWA({
				includeAssets: ['favicon/timoot.svg'],
				registerType: 'autoUpdate',
				manifest: {
					id: 'a4b945bd-512a-4819-b8aa-f8cc393b5c10',
					name: 'Timoot',
					short_name: 'Timoot',
					description: 'A fun multiplayer quiz game',
					orientation: 'natural',
					start_url: '/',
					scope: '/',
					display: 'standalone',
					display_override: ['window-controls-overlay'],
					background_color: '#ffffff',
					theme_color: '#f48120',
					icons: [
						{
							src: '/favicon/timoot.svg',
							sizes: 'any',
							type: 'image/svg+xml',
							purpose: 'any',
						},
					],
				},
				workbox: {
					navigateFallback: '/index.html',
					globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
				},
				devOptions: {
					enabled: true,
				},
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
		cacheDir: 'node_modules/.vite',
	});
}
