import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Clock, Trophy } from 'lucide-react';
import { shapeColors, shapePaths } from '@/components/game/shapes';

interface HostGetReadyProps {
	countdownMs: number;
	totalQuestions: number;
	onCountdownBeep?: () => void;
}

export function HostGetReady({ countdownMs, totalQuestions, onCountdownBeep }: HostGetReadyProps) {
	const [countdown, setCountdown] = useState(Math.ceil(countdownMs / 1000));

	useEffect(() => {
		if (countdown <= 0) {
			return;
		}

		// Play beep sound for countdown
		onCountdownBeep?.();

		const timer = setTimeout(() => {
			setCountdown((c) => c - 1);
		}, 1000);

		return () => clearTimeout(timer);
	}, [countdown, onCountdownBeep]);

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white">
			<div className="relative z-10 flex max-w-3xl flex-col items-center">
				{/* Main title */}
				<motion.h1
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					className="mb-8 text-center text-5xl font-bold sm:text-6xl"
				>
					Get Ready!
				</motion.h1>

				{/* Instructions - 3 key points with icons */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.2 }}
					className="mb-10 grid w-full gap-4 sm:grid-cols-3"
				>
					{/* Instruction 1 */}
					<div className="flex flex-col items-center justify-between rounded-2xl bg-white/10 p-5 backdrop-blur-sm">
						<div className="mb-3 flex h-10 items-center justify-center">
							<div className="relative h-12 w-12">
								{shapeColors.map((color, i) => {
									const row = Math.floor(i / 2);
									const col = i % 2;
									return (
										<div
											key={i}
											className={`absolute flex items-center justify-center rounded ${color}`}
											style={{
												top: `calc(${row * 50}% + 1px)`,
												left: `calc(${col * 50}% + 1px)`,
												width: 'calc(50% - 2px)',
												height: 'calc(50% - 2px)',
											}}
										>
											<svg viewBox="0 0 24 24" className="h-3 w-3 fill-white">
												<path d={shapePaths[i]} />
											</svg>
										</div>
									);
								})}
							</div>
						</div>
						<p className="mt-auto text-center text-lg font-medium">Tap the shape to answer</p>
					</div>

					{/* Instruction 2 */}
					<div className="flex flex-col items-center justify-between rounded-2xl bg-white/10 p-5 backdrop-blur-sm">
						<Clock className="mb-3 h-10 w-10 text-yellow-400" />
						<p className="mt-auto text-center text-lg font-medium">Faster = More points</p>
					</div>

					{/* Instruction 3 */}
					<div className="flex flex-col items-center justify-between rounded-2xl bg-white/10 p-5 backdrop-blur-sm">
						<Trophy className="mb-3 h-10 w-10 text-yellow-400" />
						<p className="mt-auto text-center text-lg font-medium">{totalQuestions} questions total</p>
					</div>
				</motion.div>

				{/* Double points hint */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.4 }}
					className="mb-10 flex items-center gap-2 text-quiz-orange"
				>
					<Zap className="h-6 w-6 fill-current" />
					<span className="text-lg font-medium">Watch for 2× point rounds!</span>
				</motion.div>

				{/* Countdown circle */}
				<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.3 }} className="relative">
					{/* Pulse rings */}
					<motion.div
						className="absolute inset-0 rounded-full border-4 border-quiz-orange"
						animate={{ scale: [1, 1.3], opacity: [0.6, 0] }}
						transition={{ duration: 1, repeat: Infinity }}
					/>
					<motion.div
						className="absolute inset-0 rounded-full border-4 border-quiz-orange"
						animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
						transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
					/>

					{/* Main countdown circle */}
					<div className="flex h-36 w-36 items-center justify-center rounded-full bg-quiz-orange shadow-lg shadow-quiz-orange/30 sm:h-44 sm:w-44">
						<AnimatePresence mode="wait">
							<motion.span
								key={countdown}
								initial={{ scale: 1.5, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								exit={{ scale: 0.5, opacity: 0 }}
								transition={{ type: 'spring', stiffness: 400, damping: 20 }}
								className="text-7xl font-bold text-white sm:text-8xl"
							>
								{countdown}
							</motion.span>
						</AnimatePresence>
					</div>
				</motion.div>

				{/* Subtitle */}
				<motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-8 text-xl text-slate-400">
					Starting soon...
				</motion.p>
			</div>
		</div>
	);
}
