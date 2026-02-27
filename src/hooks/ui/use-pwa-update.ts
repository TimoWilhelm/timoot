import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

import { toast } from '@/components/toast';

export function usePwaUpdate() {
	const {
		needRefresh: [needRefresh],
		updateServiceWorker,
	} = useRegisterSW({
		onRegisteredSW(swUrl, registration) {
			if (registration) {
				// Check for updates every 5 minutes
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

		toast.info('New version available', {
			description: 'Tap reload to update the app.',
			action: {
				label: 'Reload',
				onClick: () => updateServiceWorker(true),
			},
		});
	}, [needRefresh, updateServiceWorker]);
}
