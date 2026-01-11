import { useCallback, useEffect, useRef, useState } from 'react';

declare global {
	var turnstile:
		| {
				render: (
					container: string | HTMLElement,
					options: {
						sitekey: string;
						callback?: (token: string) => void;
						'expired-callback'?: () => void;
						'error-callback'?: () => void;
						theme?: 'light' | 'dark' | 'auto';
						size?: 'normal' | 'compact';
						appearance?: 'always' | 'execute' | 'interaction-only';
					},
				) => string;
				reset: (widgetId: string) => void;
				remove: (widgetId: string) => void;
				getResponse: (widgetId: string) => string | undefined;
		  }
		| undefined;
}

interface TurnstileWidgetProperties {
	className?: string;
}

const DEV_PLACEHOLDER_TOKEN = 'dev-mode-placeholder-token';

/**
 * Dev mode implementation - returns static placeholder.
 * This entire function is tree-shaken in production.
 */
function useTurnstileDevelopment() {
	const TurnstileWidget = ({ className }: TurnstileWidgetProperties) => (
		<div
			className={className}
			style={{
				padding: '8px 16px',
				backgroundColor: 'var(--color-muted)',
				border: '1px dashed var(--color-muted-foreground)',
				borderRadius: '4px',
				fontSize: '12px',
				color: 'var(--color-muted-foreground)',
				textAlign: 'center',
			}}
		>
			[Turnstile Disabled - Dev Mode]
		</div>
	);

	return {
		token: DEV_PLACEHOLDER_TOKEN,
		resetToken: () => {},
		TurnstileWidget,
	};
}

/**
 * Production implementation with real Turnstile widget.
 * This entire function is tree-shaken in development.
 */
function useTurnstileProduction() {
	const [token, setToken] = useState<string | undefined>();
	const widgetIdReference = useRef<string | undefined>(undefined);
	const containerReference = useRef<HTMLDivElement | undefined>(undefined);

	const resetToken = useCallback(() => {
		setToken(undefined);
		if (widgetIdReference.current && globalThis.turnstile) {
			try {
				globalThis.turnstile.reset(widgetIdReference.current);
			} catch {
				// Widget may not exist
			}
		}
	}, []);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (widgetIdReference.current && globalThis.turnstile) {
				try {
					globalThis.turnstile.remove(widgetIdReference.current);
				} catch {
					// Widget may already be removed
				}
				widgetIdReference.current = undefined;
			}
		};
	}, []);

	const TurnstileWidget = useCallback(
		({ className }: TurnstileWidgetProperties) => {
			return (
				<div
					ref={(element) => {
						if (!element || containerReference.current === element) return;
						containerReference.current = element;

						// Clean up old widget if exists
						if (widgetIdReference.current && globalThis.turnstile) {
							try {
								globalThis.turnstile.remove(widgetIdReference.current);
							} catch {
								// ignore
							}
							widgetIdReference.current = undefined;
						}

						const renderWidget = () => {
							if (!element || widgetIdReference.current || !globalThis.turnstile) return;
							try {
								widgetIdReference.current = globalThis.turnstile.render(element, {
									sitekey: import.meta.env.VITE_TURNSTILE_SITE_KEY,
									callback: (t: string) => setToken(t),
									'expired-callback': () => setToken(undefined),
									'error-callback': () => setToken(undefined),
									theme: 'light',
									appearance: 'always',
									size: 'normal',
								});
							} catch (error) {
								console.error('[Turnstile] Failed to render widget:', error);
							}
						};

						if (globalThis.turnstile) {
							renderWidget();
						} else {
							const checkInterval = setInterval(() => {
								if (globalThis.turnstile) {
									clearInterval(checkInterval);
									renderWidget();
								}
							}, 100);
						}
					}}
					className={className}
				/>
			);
		},
		[setToken],
	);

	return { token, resetToken, TurnstileWidget };
}

/**
 * Hook that provides local turnstile state and a widget component.
 * Each call creates an independent turnstile instance.
 * In development mode, returns a placeholder token and renders a placeholder widget.
 */
export const useTurnstile = import.meta.env.DEV ? useTurnstileDevelopment : useTurnstileProduction;
