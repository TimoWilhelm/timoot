import { motion } from 'motion/react';

import { cn } from '@/lib/utilities';

interface ReadingCountdownBarProperties {
	/** Progress from 1 (full) → 0 (empty) */
	progress: number;
	/** Visual variant — host uses a light theme, player uses a dark theme */
	variant?: 'host' | 'player';
}

export function ReadingCountdownBar({ progress, variant = 'host' }: ReadingCountdownBarProperties) {
	const isHost = variant === 'host';

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -6 }}
			transition={{ type: 'spring', stiffness: 400, damping: 30 }}
			className={cn('w-full', isHost ? 'px-0' : 'px-6')}
		>
			<div
				className={cn(
					`
						h-4 w-full overflow-hidden rounded-lg border-3 border-black
						shadow-brutal-sm
						sm:h-5
					`,
					isHost ? 'bg-muted' : 'bg-zinc',
				)}
			>
				<motion.div
					className="h-full rounded-[4px] bg-orange"
					initial={false}
					animate={{ width: `${Math.max(0, progress * 100)}%` }}
					transition={{ duration: 0.05, ease: 'linear' }}
				/>
			</div>
		</motion.div>
	);
}
