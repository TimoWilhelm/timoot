import { defineConfig, devices } from 'playwright/test';

const testBaseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';

export default defineConfig({
	testDir: './test/e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: [['html', { open: 'never' }]],
	use: {
		baseURL: testBaseUrl,
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
	webServer:
		process.env.CI || process.env.TEST_BASE_URL
			? undefined
			: {
					command: 'bun run build:worker-types && bunx vite --host 127.0.0.1 --port 3000 --strictPort',
					url: `${testBaseUrl}/api/health`,
					reuseExistingServer: false,
					timeout: 120_000,
				},
});
