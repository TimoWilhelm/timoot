import { useCallback } from 'react';
import { useUserId } from './use-user-id';

/**
 * Hook for fetch requests that include user identification.
 *
 * USE FOR: GET requests, useEffect data loading, any read-only API call.
 * DO NOT USE FOR: Mutations (POST/PUT/DELETE) - use createProtectedFetch instead.
 */
export function useUserFetch() {
	const { userId } = useUserId();

	const userFetch = useCallback(
		async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
			const headers = new Headers(init?.headers);
			headers.set('X-User-Id', userId);

			return fetch(input, {
				...init,
				headers,
			});
		},
		[userId],
	);

	return { userFetch, userId };
}

interface ProtectedFetchOptions {
	userId: string;
	token: string | null;
	resetToken: () => void;
}

/**
 * Creates a fetch function for turnstile-protected API requests.
 *
 * USE FOR: Mutations (POST/PUT/DELETE/PATCH) triggered by user actions (button clicks, form submits).
 * DO NOT USE FOR: GET requests or useEffect data loading - use useUserFetch hook instead.
 *
 * Automatically includes X-User-Id and X-Turnstile-Token headers, and resets the token after use.
 */
export function createProtectedFetch({ userId, token, resetToken }: ProtectedFetchOptions) {
	return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
		const headers = new Headers(init?.headers);
		headers.set('X-User-Id', userId);

		if (token) {
			headers.set('X-Turnstile-Token', token);
		}

		const response = await fetch(input, {
			...init,
			headers,
		});

		// Reset token after use
		if (token) {
			resetToken();
		}

		return response;
	};
}
