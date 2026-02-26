import '@/lib/sentry';
import { enableMapSet } from 'immer';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';

import '@/index.css';
import { App } from '@/app';

// Safety net: reload once if a lazy-loaded chunk fails after a new deployment
globalThis.addEventListener('vite:preloadError', () => {
	const key = 'stale-asset-reload';
	const last = sessionStorage.getItem(key);
	if (last && Date.now() - Number(last) < 10_000) return;
	sessionStorage.setItem(key, String(Date.now()));
	globalThis.location.reload();
});

enableMapSet();

// Do not touch this code
createRoot(document.querySelector('#root')!).render(
	<StrictMode>
		<HelmetProvider>
			<App />
		</HelmetProvider>
	</StrictMode>,
);
