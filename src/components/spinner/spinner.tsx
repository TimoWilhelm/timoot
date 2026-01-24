import { Loader2 } from 'lucide-react';
import { motion, useTime, useTransform } from 'motion/react';

import { cn } from '@/lib/utilities';

interface SpinnerProperties {
	readonly className?: string;
	readonly size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES = {
	sm: 'size-4',
	md: 'size-12',
	lg: 'size-16',
} as const;

/**
 * A synchronized spinner that maintains consistent rotation across all instances.
 * Uses framer motion's useTime hook which provides a synchronized time value,
 * so all spinners appear in sync regardless of when they mount.
 */
export function Spinner({ className, size = 'md' }: SpinnerProperties) {
	// useTime returns a MotionValue that updates with the current time in ms
	// This is synchronized across all components using it
	const time = useTime();

	// Transform time to rotation: 1 full rotation (360°) per 1000ms
	const rotate = useTransform(time, (t) => (t / 1000) * 360);

	return (
		<motion.div style={{ rotate }} className={cn(SIZE_CLASSES[size], className)}>
			<Loader2 className="size-full text-orange" />
		</motion.div>
	);
}
