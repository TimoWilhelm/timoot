import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, Trophy, Zap } from 'lucide-react';
import { shapeColors, shapePaths } from '@/components/game/shared';

interface HostGetReadyProps {
	countdownMs: number;
	totalQuestions: number;
	onCountdownBeep?: () => void;
}

export function HostGetReady({ countdownMs, totalQuestions, onCountdownBeep }: HostGetReadyProps) {
	const [countdown, setCountdown] = useState(Math.ceil(countdownMs / 1000));
	const onCountdownBeepRef = useRef(onCountdownBeep);

	useEffect(() => {
		onCountdownBeepRef.current = onCountdownBeep;
	});

	useEffect(() => {
		// Play initial beep
		onCountdownBeepRef.current?.();

		const interval = setInterval(() => {
			setCountdown((c) => {
				if (c <= 1) {
					clearInterval(interval);
					return 0;
				}
				// Play beep sound for countdown
				onCountdownBeepRef.current?.();
				return c - 1;
			});
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	return (
		<div className="flex flex-grow flex-col items-center justify-center p-6 text-foreground sm:p-10">
			<div className="relative z-10 flex max-w-3xl flex-col items-center">
				{/* Main title */}
				<motion.h1
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					className="mb-8 text-center text-4xl font-bold text-primary sm:text-5xl"
				>
					Game is about to start!
				</motion.h1>

				{/* Instructions - 3 key points with icons */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.2 }}
					className="grid w-full gap-4 sm:grid-cols-3"
				>
					{/* Instruction 1 */}
					<div className="flex flex-col items-center justify-between rounded-2xl bg-card p-5 shadow-md">
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
						<p className="mt-auto text-center text-lg font-medium text-foreground">Tap the shape to answer</p>
					</div>

					{/* Instruction 2 */}
					<div className="flex flex-col items-center justify-between rounded-2xl bg-card p-5 shadow-md">
						<Clock className="mb-3 h-10 w-10 text-quiz-orange" />
						<p className="mt-auto text-center text-lg font-medium text-foreground">Faster = More points</p>
					</div>

					{/* Instruction 3 */}
					<div className="flex flex-col items-center justify-between rounded-2xl bg-card p-5 shadow-md">
						<Trophy className="mb-3 h-10 w-10 text-quiz-orange" />
						<p className="mt-auto text-center text-lg font-medium text-foreground">{totalQuestions} questions total</p>
					</div>
				</motion.div>

				{/* Countdown circle */}
				<div className="my-12">
					<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.3 }} className="relative">
						{/* Pulse rings - using CSS animations to prevent flickering on re-render */}
						<div
							className="absolute inset-0 animate-[pulse-ring_1s_ease-out_infinite] rounded-full border-4 border-quiz-orange"
							style={{ animationFillMode: 'forwards' }}
						/>
						<div
							className="absolute inset-0 animate-[pulse-ring-outer_1s_ease-out_infinite_0.3s] rounded-full border-4 border-quiz-orange"
							style={{ animationFillMode: 'forwards' }}
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
									{countdown - 1}
								</motion.span>
							</AnimatePresence>
						</div>
					</motion.div>
				</div>

				{/* Double points hint */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.4 }}
					className="my-4 flex items-center gap-2 rounded-full bg-quiz-orange/10 px-4 py-2 text-quiz-orange"
				>
					<Zap className="h-6 w-6 fill-current" />
					<span className="text-lg font-medium">Watch for 2× point rounds!</span>
				</motion.div>
			</div>
		</div>
	);
}
