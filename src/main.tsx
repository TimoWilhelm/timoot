import '@/lib/sentry';
import { enableMapSet } from 'immer';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';

import '@/index.css';
import { App } from '@/app';

enableMapSet();

// Do not touch this code
createRoot(document.querySelector('#root')!).render(
	<StrictMode>
		<HelmetProvider>
			<App />
		</HelmetProvider>
	</StrictMode>,
);
