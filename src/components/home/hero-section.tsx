import { motion } from 'framer-motion';
import { Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useViewTransitionNavigate } from '@/hooks/use-view-transition-navigate';

export function HeroSection() {
	const navigate = useViewTransitionNavigate();

	return (
		<header
			className="
				mb-10 flex flex-col items-center justify-center px-4 text-center
				sm:mb-20
			"
		>
			{/* Logo / Badge */}
			<motion.div
				initial={{ scale: 0.9, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
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

			<motion.h1
				initial={{ y: 20, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ delay: 0.1 }}
				className="
					mb-6 font-display text-5xl leading-tight font-black tracking-tighter
					text-black uppercase
					sm:mb-8 sm:text-7xl
					md:text-8xl
					lg:text-9xl
					xl:text-[10rem]
				"
			>
				TIM<span className="text-orange">OOT</span>
			</motion.h1>

			<motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="relative z-20">
				<Button
					onClick={() => navigate('/play')}
					variant="accent"
					className="
						group relative inline-flex items-center gap-2 rounded-lg px-6 py-5
						font-display text-xl font-bold tracking-wide uppercase shadow-brutal
						hover:-translate-y-0.5 hover:shadow-brutal-lg
						active:translate-y-0 active:shadow-brutal-sm
						sm:gap-3 sm:rounded-xl sm:px-10 sm:py-8 sm:text-3xl
						md:gap-4 md:px-12 md:py-10 md:text-4xl
					"
				>
					<Gamepad2
						className="
							size-6 transition-transform
							group-hover:rotate-12
							sm:size-8
							md:size-10
						"
						strokeWidth={2.5}
					/>
					<span>Join Game</span>
				</Button>
			</motion.div>
		</header>
	);
}
