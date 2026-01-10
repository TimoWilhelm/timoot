import { motion } from 'framer-motion';
import { Gamepad2 } from 'lucide-react';

import { Button } from '@/components/button';
import { useViewTransitionNavigate } from '@/hooks/ui/use-view-transition-navigate';

export function HeroSection() {
	const navigate = useViewTransitionNavigate();

	return (
		<header className="flex flex-col items-center justify-center px-4 text-center">
			{/* Logo / Badge */}
			<motion.div
				initial={{ scale: 0, rotate: 10, opacity: 0 }}
				animate={{ scale: 1, rotate: 0, opacity: 1 }}
				transition={{
					type: 'spring',
					stiffness: 260,
					damping: 20,
					delay: 0.1,
				}}
				className="
					mb-6 inline-block -rotate-2 rounded-full border-2 border-black bg-yellow
					px-4 py-1.5 shadow-brutal
					sm:mb-8 sm:px-6 sm:py-2
				"
			>
				<span
					className="
						font-display text-sm font-bold tracking-wider text-black uppercase
						sm:text-lg
					"
				>
					The Ultimate Quiz Game
				</span>
			</motion.div>

			<div
				className="
					relative z-10 mb-8 flex flex-col items-center justify-center
					sm:mb-12
				"
			>
				<h1
					className="
						flex items-center justify-center font-display text-5xl leading-none
						font-black tracking-tighter uppercase select-none
						sm:text-7xl
						md:text-8xl
						lg:text-9xl
						xl:text-[10rem]
					"
				>
					<motion.span
						initial={{ opacity: 0, x: 50 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
						className="relative z-10 text-black"
					>
						TIM
					</motion.span>

					<motion.span
						initial={{ scale: 0, rotate: -15, opacity: 0 }}
						animate={{ scale: 1, rotate: 0, opacity: 1 }}
						transition={{
							type: 'spring',
							stiffness: 300,
							damping: 18,
							mass: 0.8,
							delay: 0.15,
						}}
						className="relative z-0 text-orange"
					>
						OOT
					</motion.span>
				</h1>
			</div>

			<motion.div
				initial={{ y: 50, scale: 0.5, opacity: 0 }}
				animate={{ y: 0, scale: 1, opacity: 1 }}
				transition={{
					type: 'spring',
					stiffness: 200,
					damping: 15,
					delay: 0.4,
				}}
				className="relative z-20"
			>
				<Button
					onClick={() => navigate('/play')}
					variant="accent"
					size="xl"
					className="
						group relative inline-flex items-center gap-3 px-8 py-6 font-display
						text-2xl font-bold tracking-wide uppercase
						sm:gap-4 sm:rounded-2xl sm:px-12 sm:py-8 sm:text-4xl
						md:px-16 md:py-10 md:text-5xl
					"
				>
					<Gamepad2
						className="
							size-7 transition-all duration-75 ease-out
							group-hover:rotate-12
							group-active:translate-y-0.5 group-active:scale-90
							group-active:-rotate-45
							sm:size-10
							md:size-12
						"
						strokeWidth={2.5}
					/>
					<span>Join Game</span>
				</Button>
			</motion.div>
		</header>
	);
}
