import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [react()],
	test: {
		environment: 'jsdom',
		include: ['src/**/*.test.{ts,tsx}'],
		globals: true,
		setupFiles: ['./test/setup-react.ts'],
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
			'@shared': path.resolve(__dirname, './shared'),
		},
	},
});
