import { bindings, defineConfig, exports } from 'cf/config';

import * as entrypoint from './worker/index.ts' with { type: 'cf-worker' };

export default defineConfig({
	accountId: 'd64471fef208e0cf9687449dc8a5878b',
	worker: {
		name: 'timoot',
		compatibilityDate: '2025-11-17',
		compatibilityFlags: ['nodejs_als'],
		entrypoint,
		exports: {
			GameRoomDurableObject: exports.durableObject<undefined>({ storage: 'sqlite' }),
			UserStoreDurableObject: exports.durableObject<undefined>({ storage: 'sqlite' }),
		},
		observability: {
			issues: {
				enabled: true,
			},
			logs: {
				enabled: true,
			},
			traces: {
				enabled: true,
			},
		},
		assets: {
			notFoundHandling: 'single-page-application',
			runWorkerFirst: ['/api/*', '!/api/docs/*'],
		},
		env: {
			TURNSTILE_SECRET_KEY: bindings.secret(),
			GET_READY_COUNTDOWN_MS: bindings.json(6000),
			WORKERS_AI_MODEL: bindings.text('@cf/google/gemma-4-26b-a4b-it'),
			KV_IMAGES: bindings.kv({}),
			KV_SYNC: bindings.kv({}),
			GAME_ROOM: bindings.durableObject({
				worker: 'timoot',
				exportName: 'GameRoomDurableObject',
			}),
			USER_STORE: bindings.durableObject({
				worker: 'timoot',
				exportName: 'UserStoreDurableObject',
			}),
			AI: bindings.ai({
				dev: {
					remote: true,
				},
			}),
			CF_VERSION_METADATA: bindings.versionMetadata(),
			GAME_RATE_LIMITER: bindings.rateLimit({
				namespace: '1001',
				simple: {
					limit: 10,
					period: 60,
				},
			}),
			AI_RATE_LIMITER: bindings.rateLimit({
				namespace: '1002',
				simple: {
					limit: 5,
					period: 60,
				},
			}),
			ASSETS: bindings.assets(),
		},
	},
});
