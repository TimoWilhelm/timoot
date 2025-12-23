import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { useEffect } from 'react';

interface AnimatedNumberProps {
	value: number;
	className?: string;
	duration?: number;
	instant?: boolean;
}

/**
 * Animated number component that tweens between values using Framer Motion
 */
export function AnimatedNumber({ value, className, duration = 0.6, instant = false }: AnimatedNumberProps) {
	const motionValue = useMotionValue(value);
	const display = useTransform(motionValue, (current: number) => Math.round(current));

	useEffect(() => {
		if (instant) {
			motionValue.set(value);
			return;
		}
		const controls = animate(motionValue, value, {
			duration,
			ease: 'easeOut',
		});
		return () => controls.stop();
	}, [motionValue, value, duration, instant]);

	return <motion.span className={className}>{display}</motion.span>;
}
