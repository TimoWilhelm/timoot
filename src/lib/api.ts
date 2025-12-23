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
