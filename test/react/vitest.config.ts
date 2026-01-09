import path from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(dirname, '../../');

export default defineConfig({
	plugins: [react()],
	test: {
		environment: 'jsdom',
		include: ['src/**/*.test.{ts,tsx}'],
		globals: true,
		setupFiles: [path.join(projectRoot, 'test/react/setup.ts')],
	},
	resolve: {
		alias: {
			'@': path.join(projectRoot, 'src'),
			'@shared': path.join(projectRoot, 'shared'),
		},
	},
});
