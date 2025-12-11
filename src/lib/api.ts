import { getUserId } from './user-id';

/**
 * Wrapper around fetch that automatically includes the X-User-Id header
 * for user-scoped data isolation.
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
	const userId = getUserId();
	const headers = new Headers(init?.headers);
	headers.set('X-User-Id', userId);

	return fetch(input, {
		...init,
		headers,
	});
}

/**
 * Helper for JSON API requests with user ID header
 */
export async function apiJson<T>(url: string, options?: RequestInit): Promise<T> {
	const response = await apiFetch(url, options);
	return response.json() as Promise<T>;
}
