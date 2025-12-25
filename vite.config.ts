import path from 'path';
import { defineConfig, UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import pino from 'pino';
import devtoolsJson from 'vite-plugin-devtools-json';
import { cloudflare } from '@cloudflare/vite-plugin';

const logger = pino();

const stripAnsi = (str: string) =>
	str.replace(
		// eslint-disable-next-line no-control-regex -- Allow ANSI escape stripping
		/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
		'',
	);

const LOG_MESSAGE_BOUNDARY = /\n(?=\[[A-Z][^\]]*\])/g;

const emitLog = (level: 'info' | 'warn' | 'error', rawMessage: string) => {
	const cleaned = stripAnsi(rawMessage).replace(/\r\n/g, '\n');
	const parts = cleaned
		.split(LOG_MESSAGE_BOUNDARY)
		.map((part) => part.trimEnd())
		.filter((part) => part.trim().length > 0);

	if (parts.length === 0) {
		logger[level](cleaned.trimEnd());
		return;
	}

	for (const part of parts) {
		logger[level](part);
	}
};

const customLogger = {
	warnOnce: (msg: string) => emitLog('warn', msg),

	// Use Pino's methods, passing the cleaned message
	info: (msg: string) => emitLog('info', msg),
	warn: (msg: string) => emitLog('warn', msg),
	error: (msg: string) => emitLog('error', msg),
	hasErrorLogged: () => false,

	// Keep these as-is
	clearScreen: () => {},
	hasWarned: false,
};

// https://vite.dev/config/
export default (): UserConfig => {
	return defineConfig({
		plugins: [devtoolsJson(), react(), cloudflare()],
		build: {
			minify: true,
		},
		customLogger,
		css: {
			devSourcemap: true,
		},
		resolve: {
			alias: {
				'@': path.resolve(__dirname, './src'),
				'@shared': path.resolve(__dirname, './shared'),
			},
		},
		optimizeDeps: {
			// This is still crucial for reducing the time from when `bun run dev`
			// is executed to when the server is actually ready.
			include: ['react', 'react-dom', 'react-router-dom'],
			force: true,
		},
		// Clear cache more aggressively
		cacheDir: 'node_modules/.vite',
	});
};
