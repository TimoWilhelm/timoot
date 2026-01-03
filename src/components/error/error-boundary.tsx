import React, { Component, ErrorInfo, ReactNode } from 'react';

import { Sentry } from '@/lib/sentry';

import { ErrorFallback } from './error-fallback';

interface Properties {
	children: ReactNode;
	fallback?: (error: Error, errorInfo: ErrorInfo, retry: () => void) => ReactNode;
}

interface State {
	hasError: boolean;
	error: Error | undefined;
	errorInfo: ErrorInfo | undefined;
}

export class ErrorBoundary extends Component<Properties, State> {
	public state: State = {
		hasError: false,
		error: undefined,
		errorInfo: undefined,
	};

	public static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error, errorInfo: undefined };
	}

	public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		// Update state with error info
		this.setState({ errorInfo });

		// Capture exception in Sentry
		Sentry.captureException(error, {
			contexts: {
				react: {
					componentStack: errorInfo.componentStack,
				},
			},
			tags: {
				errorBoundary: 'true',
				componentName: this.constructor.name,
			},
		});
	}

	private retry = () => {
		this.setState({ hasError: false, error: undefined, errorInfo: undefined });
		// Reload the page to ensure clean state
		globalThis.location.reload();
	};

	private goHome = () => {
		globalThis.location.href = '/';
	};

	public render() {
		if (this.state.hasError && this.state.error) {
			if (this.props.fallback) {
				return this.props.fallback(this.state.error, this.state.errorInfo!, this.retry);
			}

			// Use shared ErrorFallback component
			return <ErrorFallback error={this.state.error} onRetry={this.retry} onGoHome={this.goHome} />;
		}

		return this.props.children;
	}
}
