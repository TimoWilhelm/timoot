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

/**
 * Hook that provides local turnstile state and a widget component.
 * Each call creates an independent turnstile instance.
 */
export function useTurnstile() {
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
