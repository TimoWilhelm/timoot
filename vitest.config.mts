import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';
import * as path from 'node:path';

export default defineWorkersConfig({
	test: {
		include: ['tests/**/*.test.ts'],
		globals: true,
		poolOptions: {
			workers: {
				wrangler: {
					configPath: './wrangler.jsonc',
				},
			},
		},
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
			'@shared': path.resolve(__dirname, './shared'),
		},
	},
});
