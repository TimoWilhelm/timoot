import path from 'node:path';

import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
	test: {
		root: path.resolve(__dirname, '../../'),
		include: ['worker/**/*.test.{ts,tsx}'],
		globals: true,
		poolOptions: {
			workers: {
				main: path.resolve(__dirname, '../../worker/index.ts'),
				isolatedStorage: false,
			},
		},
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, '../../src'),
			'@shared': path.resolve(__dirname, '../../shared'),
		},
	},
});
