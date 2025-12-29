import { motion } from 'framer-motion';
import { Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useViewTransitionNavigate } from '@/hooks/use-view-transition-navigate';

export function HeroSection() {
	const navigate = useViewTransitionNavigate();

	return (
		<header className="mb-20 flex flex-col items-center justify-center text-center">
			{/* Logo / Badge */}
			<motion.div
				initial={{ scale: 0.9, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				className="
					mb-8 inline-block -rotate-2 rounded-full border-2 border-black
					bg-yellow-300 px-6 py-2 shadow-brutal
				"
			>
				<span
					className="
						font-display text-lg font-bold tracking-wider text-black uppercase
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
					mb-8 font-display text-7xl leading-tight font-black tracking-tighter
					text-black uppercase
					sm:text-8xl
					md:text-9xl
					lg:text-[10rem]
				"
			>
				TIM<span className="text-quiz-orange">OOT</span>
			</motion.h1>

			<motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="relative z-20">
				<Button
					onClick={() => navigate('/play')}
					variant="primary"
					className="
						group relative inline-flex items-center gap-4 rounded-xl px-12 py-10
						text-4xl uppercase shadow-brutal
						hover:-translate-y-0.5 hover:shadow-brutal-lg
						active:translate-y-0 active:shadow-brutal-sm
					"
				>
					<Gamepad2
						className="
							size-8 transition-transform
							group-hover:rotate-12
						"
						strokeWidth={2.5}
					/>
					<span>Join Game</span>
				</Button>
			</motion.div>
		</header>
	);
}
