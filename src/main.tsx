import '@/lib/sentry';
import { enableMapSet } from 'immer';
enableMapSet();
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/index.css';
import { App } from '@/app';
// Do not touch this code
createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
