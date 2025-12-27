import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { useEffect } from 'react';
import { ErrorFallback } from './error-fallback';
import { Sentry } from '@/lib/sentry';

export function RouteErrorBoundary() {
	const error = useRouteError();

	useEffect(() => {
		// Report the route error
		if (error) {
			let errorMessage = 'Unknown route error';
			let errorStack = '';

			if (isRouteErrorResponse(error)) {
				errorMessage = `Route Error ${error.status}: ${error.statusText}`;
				if (error.data) {
					errorMessage += ` - ${JSON.stringify(error.data)}`;
				}
			} else if (error instanceof Error) {
				errorMessage = error.message;
				errorStack = error.stack || '';
			} else if (typeof error === 'string') {
				errorMessage = error;
			} else {
				errorMessage = JSON.stringify(error);
			}

			// Capture exception in Sentry
			Sentry.captureException(error instanceof Error ? error : new Error(errorMessage), {
				tags: {
					source: 'react-router',
				},
				extra: {
					errorMessage,
					errorStack,
				},
			});
		}
	}, [error]);

	// Render error UI using shared ErrorFallback component
	if (isRouteErrorResponse(error)) {
		return (
			<ErrorFallback
				title={`${error.status} ${error.statusText}`}
				message="Sorry, an error occurred while loading this page."
				error={error.data ? { message: JSON.stringify(error.data, undefined, 2) } : error}
				statusMessage="Navigation error detected"
			/>
		);
	}

	return (
		<ErrorFallback
			title="Unexpected Error"
			message="An unexpected error occurred while loading this page."
			error={error}
			statusMessage="Routing error detected"
		/>
	);
}
