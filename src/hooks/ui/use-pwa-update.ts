import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

import { toast } from '@/components/toast';

// Grace period to distinguish a pre-existing waiting SW from a mid-session update
const INITIAL_LOAD_GRACE_MS = 2000;
const pageLoadedAt = Date.now();

export function usePwaUpdate() {
	const {
		needRefresh: [needRefresh],
		updateServiceWorker,
	} = useRegisterSW({
		onRegisteredSW(swUrl, registration) {
			if (registration) {
				const intervalMs = 5 * 60 * 1000;
				setInterval(async () => {
					if (!(!registration.installing && navigator)) return;

					if ('connection' in navigator && !navigator.onLine) return;

					const response = await fetch(swUrl, {
						cache: 'no-store',
						headers: { cache: 'no-store' },
					});

					if (response.ok) {
						await registration.update();
					}
				}, intervalMs);
			}
		},
	});

	useEffect(() => {
		if (!needRefresh) return;

		const isInitialLoad = Date.now() - pageLoadedAt < INITIAL_LOAD_GRACE_MS;

		if (isInitialLoad) {
			void updateServiceWorker(true);
			return;
		}

		toast.info('New version available', {
			description: 'Tap reload to update the app.',
			action: {
				label: 'Reload',
				onClick: () => updateServiceWorker(true),
			},
		});
	}, [needRefresh, updateServiceWorker]);
}
