import { useEffect, useState } from 'react';

/**
 * Computes reading countdown state from server timestamps.
 * Reconnection-safe: if reading has elapsed, `isReading` is false on mount.
 */
export function useReadingCountdown(startTime: number, readingDurationMs: number) {
	const [now, setNow] = useState(Date.now);

	const remainingMs = Math.max(0, startTime - now);
	const isReading = remainingMs > 0 && readingDurationMs > 0;
	const progress = readingDurationMs > 0 ? remainingMs / readingDurationMs : 0;
	const secondsLeft = Math.ceil(remainingMs / 1000);

	useEffect(() => {
		if (!isReading) return;

		const timer = setInterval(() => {
			const current = Date.now();
			setNow(current);
			if (current >= startTime) {
				clearInterval(timer);
			}
		}, 50);

		return () => clearInterval(timer);
	}, [startTime, isReading]);

	return { isReading, progress, secondsLeft };
}
