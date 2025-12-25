import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'timoot_user_id';

function getSnapshot(): string {
	let userId = localStorage.getItem(STORAGE_KEY);
	if (!userId) {
		userId = crypto.randomUUID();
		localStorage.setItem(STORAGE_KEY, userId);
	}
	return userId;
}

function subscribe(callback: () => void): () => void {
	const handler = (e: StorageEvent) => {
		if (e.key === STORAGE_KEY) callback();
	};
	window.addEventListener('storage', handler);
	return () => window.removeEventListener('storage', handler);
}

/**
 * Hook for accessing the persistent anonymous user ID.
 * Returns the current userId and a setter for syncing devices.
 */
export function useUserId() {
	const userId = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

	const setUserId = useCallback((newUserId: string) => {
		localStorage.setItem(STORAGE_KEY, newUserId);
		// Trigger re-render by dispatching storage event
		window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
	}, []);

	return { userId, setUserId };
}
