import path from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig, mergeConfig } from 'vite';
import { defineConfig as defineVitestConfig } from 'vitest/config';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(dirname, '../../');

export default mergeConfig(
	defineConfig({
		plugins: [react()],
		resolve: {
			alias: {
				'@': path.join(projectRoot, 'src'),
				'@shared': path.join(projectRoot, 'shared'),
			},
		},
	}),
	defineVitestConfig({
		test: {
			environment: 'jsdom',
			include: ['src/**/*.test.{ts,tsx}'],
			globals: true,
			setupFiles: [path.join(projectRoot, 'test/react/setup.ts')],
		},
	}),
);
