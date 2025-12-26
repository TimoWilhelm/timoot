import * as Sentry from '@sentry/react';

Sentry.init({
	dsn: import.meta.env.VITE_SENTRY_DSN,

	integrations: [
		Sentry.browserTracingIntegration(),
		Sentry.replayIntegration(),
		Sentry.consoleLoggingIntegration({ levels: ['warn', 'error'] }),
	],

	// Performance monitoring
	tracesSampleRate: 1.0,

	// Session replay
	replaysSessionSampleRate: 0.1,
	replaysOnErrorSampleRate: 1.0,

	// Logging
	_experiments: {
		enableLogs: true,
	},

	// Environment
	environment: import.meta.env.MODE,
});

export { Sentry };
