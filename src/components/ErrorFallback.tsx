import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export interface ErrorFallbackProps {
	title?: string;
	message?: string;
	error?: Error | any;
	onRetry?: () => void;
	onGoHome?: () => void;
	showErrorDetails?: boolean;
	statusMessage?: string;
}

export function ErrorFallback({
	title = 'Oops! Something went wrong',
	message = "We're aware of the issue and actively working to fix it. Your experience matters to us.",
	error,
	onRetry,
	onGoHome,
	showErrorDetails = true,
	statusMessage = 'Our team has been notified',
}: ErrorFallbackProps) {
	const handleRetry = () => {
		if (onRetry) {
			onRetry();
		} else {
			window.location.reload();
		}
	};

	const handleGoHome = () => {
		if (onGoHome) {
			onGoHome();
		} else {
			window.location.href = '/';
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-4">
			<div className="w-full max-w-md">
				{/* Animated background gradient */}
				<div className="absolute inset-0 bg-gradient-rainbow opacity-5 dark:opacity-10" />

				{/* Error card */}
				<Card className="relative shadow-2xl backdrop-blur-sm">
					<CardContent className="space-y-6 p-8">
						{/* Icon and title */}
						<div className="space-y-4 text-center">
							<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
								<AlertTriangle className="h-8 w-8 text-destructive" />
							</div>
							<h1 className="text-2xl font-bold">{title}</h1>
							<p className="text-muted-foreground">{message}</p>
						</div>

						{/* Status indicator */}
						{statusMessage && (
							<div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
								<div className="h-2 w-2 animate-pulse rounded-full bg-orange-500" />
								<span>{statusMessage}</span>
							</div>
						)}

						{/* Action buttons */}
						<div className="space-y-3">
							<Button onClick={handleRetry} className="w-full">
								<RefreshCw className="mr-2 h-4 w-4" />
								Try Again
							</Button>
							<Button onClick={handleGoHome} variant="secondary" className="w-full">
								<Home className="mr-2 h-4 w-4" />
								Go to Homepage
							</Button>
						</div>

						{/* Error details (collapsible) */}
						{process.env.NODE_ENV === 'development' && showErrorDetails && error && (
							<details className="mt-6 rounded-lg bg-muted/50 p-4">
								<summary className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
									Error details (Development only)
								</summary>
								<pre className="mt-3 max-h-40 overflow-auto text-xs text-muted-foreground">
									{error.message || error.toString()}
									{error.stack && '\n\n' + error.stack + '\n\n' + error.componentStack}
								</pre>
							</details>
						)}
					</CardContent>
				</Card>

				{/* Support text */}
				<p className="mt-6 text-center text-sm text-muted-foreground">If this problem persists, please contact our support team</p>
			</div>
		</div>
	);
}
