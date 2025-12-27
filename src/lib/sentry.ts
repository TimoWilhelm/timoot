import * as Sentry from '@sentry/react';

Sentry.init({
	dsn: import.meta.env.VITE_SENTRY_DSN,

	integrations: [
		Sentry.browserTracingIntegration(),
		Sentry.replayIntegration(),
		Sentry.consoleLoggingIntegration({ levels: ['warn', 'error'] }),
	],

	// Performance monitoring
	tracesSampleRate: 1,

	// Session replay
	replaysSessionSampleRate: 0.1,
	replaysOnErrorSampleRate: 1,

	// Logging
	_experiments: {
		enableLogs: true,
	},

	// Environment
	environment: import.meta.env.MODE,
});

void fetch('/api/version')
	.then((response) => response.json())
	.then((data: { success: boolean; data: { release: string | null } }) => {
		if (data.success && data.data.release) {
			const client = Sentry.getClient();
			if (client) {
				client.getOptions().release = data.data.release;
			}
		}
	})
	.catch(() => {});

export * as Sentry from '@sentry/react';
