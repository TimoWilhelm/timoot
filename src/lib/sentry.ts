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

try {
	const response = await fetch('/api/version');
	const data: { success: boolean; data: { release: string | null } } = await response.json();
	if (data.success && data.data.release) {
		const client = Sentry.getClient();
		if (client) {
			client.getOptions().release = data.data.release;
		}
	}
} catch {
	// Ignore fetch errors
}

export * as Sentry from '@sentry/react';
