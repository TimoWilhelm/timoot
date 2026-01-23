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
	// SEO Constants
	const title = 'Timoot';
	const description = 'A fun multiplayer quiz game';
	const themeColor = '#f48120';
	const origin = 'https://timoot.com';
	const image = new URL('/og-image.png', origin).href;
	const logo = new URL('/favicon/timoot.svg', origin).href;
	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: title,
		url: `${origin}/`,
		description: description,
		image: image,
	};

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
				registerType: 'autoUpdate',
				manifest: {
					id: 'a4b945bd-512a-4819-b8aa-f8cc393b5c10',
					name: title,
					short_name: title,
					description,
					orientation: 'natural',
					start_url: '/',
					scope: '/',
					display: 'standalone',
					display_override: ['window-controls-overlay'],
					background_color: '#ffffff',
					theme_color: themeColor,
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
			{
				name: 'vite-plugin-seo-inject',
				transformIndexHtml() {
					return [
						// Basic Defaults
						{ tag: 'title', children: title },
						{ tag: 'meta', attrs: { name: 'description', content: description } },
						{ tag: 'meta', attrs: { name: 'theme-color', content: themeColor } },

						// OpenGraph
						{ tag: 'meta', attrs: { property: 'og:title', content: title } },
						{ tag: 'meta', attrs: { property: 'og:description', content: description } },
						{ tag: 'meta', attrs: { property: 'og:type', content: 'website' } },
						{ tag: 'meta', attrs: { property: 'og:site_name', content: 'Timoot' } },
						{ tag: 'meta', attrs: { property: 'og:url', content: `${origin}/` } },
						{ tag: 'meta', attrs: { property: 'og:image', content: image } },
						{ tag: 'meta', attrs: { property: 'og:logo', content: logo } },

						// Twitter
						{ tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
						{ tag: 'meta', attrs: { name: 'twitter:title', content: title } },
						{ tag: 'meta', attrs: { name: 'twitter:description', content: description } },
						{ tag: 'meta', attrs: { name: 'twitter:image', content: image } },

						// JSON-LD
						{
							tag: 'script',
							attrs: { type: 'application/ld+json' },
							children: JSON.stringify(jsonLd),
						},
					];
				},
			},
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
