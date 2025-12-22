import { defineConfig } from 'vitest/config';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	plugins: [
		react(),
		storybookTest({
			configDir: path.join(dirname, '.storybook'),
			storybookScript: 'bun run storybook --ci',
		}),
	],
	resolve: {
		alias: {
			'@': path.join(dirname, './src'),
			'@shared': path.join(dirname, './shared'),
		},
	},
	test: {
		name: 'storybook',
		browser: {
			enabled: true,
			headless: true,
			provider: 'playwright',
			instances: [{ browser: 'chromium' }],
		},
		setupFiles: ['./.storybook/vitest.setup.ts'],
	},
});
