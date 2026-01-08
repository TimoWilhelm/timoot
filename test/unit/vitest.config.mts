import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(dirname, '../../');

export default defineWorkersConfig({
	test: {
		root: projectRoot,
		include: ['worker/**/*.test.{ts,tsx}', 'shared/**/*.test.{ts,tsx}'],
		globals: true,
		poolOptions: {
			workers: {
				main: path.resolve(projectRoot, 'worker/index.ts'),
				isolatedStorage: false,
			},
		},
	},
	resolve: {
		alias: {
			'@': path.resolve(projectRoot, 'src'),
			'@shared': path.resolve(projectRoot, 'shared'),
		},
	},
});
