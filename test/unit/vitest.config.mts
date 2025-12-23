import * as path from 'node:path';
import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
	test: {
		include: ['test/unit/**/*.test.ts'],
		globals: true,
		poolOptions: {
			workers: {
				wrangler: {
					configPath: '../../wrangler.jsonc',
				},
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
