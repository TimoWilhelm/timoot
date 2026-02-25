import { AnimatePresence, motion } from 'motion/react';

import { cn } from '@/lib/utilities';

interface ReadingCountdownBarProperties {
	/** Progress from 1 (full) → 0 (empty) */
	progress: number;
	/** Seconds remaining in the countdown */
	secondsLeft: number;
	/** Visual variant — host uses a light theme, player uses a dark theme */
	variant?: 'host' | 'player';
}

export function ReadingCountdownBar({ progress, secondsLeft, variant = 'host' }: ReadingCountdownBarProperties) {
	const isHost = variant === 'host';

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -10 }}
			transition={{ type: 'spring', stiffness: 300, damping: 25 }}
			className={cn('flex w-full flex-col items-center gap-4', isHost ? 'px-0' : 'px-6')}
		>
			<div className="flex items-center gap-3">
				<span className={cn('font-display text-lg font-black tracking-wide uppercase', isHost ? 'text-black' : 'text-white', 'sm:text-xl')}>
					Read the question!
				</span>
				<AnimatePresence mode="wait" initial={false}>
					<motion.span
						key={secondsLeft}
						initial={{ scale: 0.5, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 1.3, opacity: 0 }}
						transition={{ duration: 0.15 }}
						className={cn(
							`
								flex size-9 items-center justify-center rounded-lg border-2 border-black
								font-display text-lg font-black shadow-brutal-sm
								sm:size-10 sm:text-xl
							`,
							isHost ? 'bg-orange text-white' : 'bg-orange text-white',
						)}
					>
						{secondsLeft}
					</motion.span>
				</AnimatePresence>
			</div>

			<div
				className={cn(
					`
						h-5 w-full overflow-hidden rounded-lg border-3 border-black
						shadow-brutal-sm
						sm:h-6
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
