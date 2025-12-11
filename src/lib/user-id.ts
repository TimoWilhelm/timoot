const STORAGE_KEY = 'timoot_user_id';

/**
 * Get or create a persistent anonymous user ID.
 * Stored in localStorage to persist across sessions.
 */
export function getUserId(): string {
	let userId = localStorage.getItem(STORAGE_KEY);
	if (!userId) {
		userId = crypto.randomUUID();
		localStorage.setItem(STORAGE_KEY, userId);
	}
	return userId;
}

/**
 * Set the user ID (used when redeeming a sync code)
 */
export function setUserId(userId: string): void {
	localStorage.setItem(STORAGE_KEY, userId);
}

/**
 * Clear the user ID (useful for testing or "reset" functionality)
 */
export function clearUserId(): void {
	localStorage.removeItem(STORAGE_KEY);
}
