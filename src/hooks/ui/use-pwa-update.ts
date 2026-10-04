import { useCallback, useEffect, useRef } from 'react';

import { toast } from '@/components/toast';
import { useRegisterSW } from '@/lib/pwa-register';

export function usePwaUpdate() {
	const updateIntervalReference = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
	const isMountedReference = useRef(true);
	const isActivationRequestedReference = useRef(false);
	const hasNotifiedUpdateReference = useRef(false);

	const {
		needRefresh: [needRefresh],
		updateServiceWorker,
	} = useRegisterSW({
		onRegisteredSW(swUrl, registration) {
			if (registration && isMountedReference.current) {
				const intervalMs = 5 * 60 * 1000;
				clearInterval(updateIntervalReference.current);
				updateIntervalReference.current = setInterval(async () => {
					if (registration.installing || !navigator.onLine) return;

					try {
						const response = await fetch(swUrl, {
							cache: 'no-store',
							headers: { cache: 'no-store' },
						});

						if (response.ok) {
							await registration.update();
						}
					} catch {
						return;
					}
				}, intervalMs);
			}
		},
	});

	const activateUpdate = useCallback(() => {
		if (!isMountedReference.current || isActivationRequestedReference.current) return;
		isActivationRequestedReference.current = true;
		void updateServiceWorker(true).catch(() => {
			isActivationRequestedReference.current = false;
		});
	}, [updateServiceWorker]);

	useEffect(() => {
		isMountedReference.current = true;
		return () => {
			isMountedReference.current = false;
			clearInterval(updateIntervalReference.current);
		};
	}, []);

	useEffect(() => {
		if (!needRefresh) {
			hasNotifiedUpdateReference.current = false;
			return;
		}
		if (hasNotifiedUpdateReference.current) return;
		hasNotifiedUpdateReference.current = true;

		toast.info('New version available', {
			description: 'Tap reload to update the app.',
			action: {
				label: 'Reload',
				onClick: activateUpdate,
			},
		});
	}, [activateUpdate, needRefresh]);
}
