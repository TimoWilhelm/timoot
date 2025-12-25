import { useCallback, useEffect, useRef, useState } from 'react';

declare global {
	interface Window {
		turnstile?: {
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
		};
	}
}

interface TurnstileWidgetProps {
	className?: string;
}

const DEV_PLACEHOLDER_TOKEN = 'dev-mode-placeholder-token';

/**
 * Dev mode implementation - returns static placeholder.
 * This entire function is tree-shaken in production.
 */
function useTurnstileDev() {
	const TurnstileWidget = ({ className }: TurnstileWidgetProps) => (
		<div
			className={className}
			style={{
				padding: '8px 16px',
				backgroundColor: '#f0f0f0',
				border: '1px dashed #999',
				borderRadius: '4px',
				fontSize: '12px',
				color: '#666',
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
function useTurnstileProd() {
	const [token, setToken] = useState<string | null>(null);
	const widgetIdRef = useRef<string | null>(null);
	const containerRef = useRef<HTMLDivElement | null>(null);

	const resetToken = useCallback(() => setToken(null), []);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (widgetIdRef.current && window.turnstile) {
				try {
					window.turnstile.remove(widgetIdRef.current);
				} catch {
					// Widget may already be removed
				}
				widgetIdRef.current = null;
			}
		};
	}, []);

	const TurnstileWidget = useCallback(
		({ className }: TurnstileWidgetProps) => {
			return (
				<div
					ref={(el) => {
						if (!el || containerRef.current === el) return;
						containerRef.current = el;

						// Clean up old widget if exists
						if (widgetIdRef.current && window.turnstile) {
							try {
								window.turnstile.remove(widgetIdRef.current);
							} catch {
								// ignore
							}
							widgetIdRef.current = null;
						}

						const renderWidget = () => {
							if (!el || widgetIdRef.current || !window.turnstile) return;
							try {
								widgetIdRef.current = window.turnstile.render(el, {
									sitekey: import.meta.env.VITE_TURNSTILE_SITE_KEY,
									callback: (t: string) => setToken(t),
									'expired-callback': () => setToken(null),
									'error-callback': () => setToken(null),
									theme: 'light',
									appearance: 'always',
									size: 'normal',
								});
							} catch (e) {
								console.error('[Turnstile] Failed to render widget:', e);
							}
						};

						if (window.turnstile) {
							renderWidget();
						} else {
							const checkInterval = setInterval(() => {
								if (window.turnstile) {
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
export const useTurnstile = import.meta.env.DEV ? useTurnstileDev : useTurnstileProd;
