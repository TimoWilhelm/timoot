import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, Trophy, Zap } from 'lucide-react';
import { shapeColors, shapePaths } from '@/components/game/shared';
import { cn } from '@/lib/utilities';

interface HostGetReadyProperties {
	countdownMs: number;
	totalQuestions: number;
	onCountdownBeep?: () => void;
}

export function HostGetReady({ countdownMs, totalQuestions, onCountdownBeep }: HostGetReadyProperties) {
	const [countdown, setCountdown] = useState(Math.ceil(countdownMs / 1000));
	const onCountdownBeepReference = useRef(onCountdownBeep);

	useEffect(() => {
		onCountdownBeepReference.current = onCountdownBeep;
	});

	useEffect(() => {
		// Play initial beep
		onCountdownBeepReference.current?.();

		const interval = setInterval(() => {
			setCountdown((c) => {
				if (c <= 1) {
					clearInterval(interval);
					return 0;
				}
				// Play beep sound for countdown
				onCountdownBeepReference.current?.();
				return c - 1;
			});
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	return (
		<div
			className={`
				flex grow flex-col items-center justify-center p-6
				sm:p-10
			`}
		>
			<div className="relative z-10 flex max-w-3xl flex-col items-center">
				{/* Main title */}
				<motion.h1
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					className={`
						mb-8 text-center font-display text-4xl font-bold
						sm:text-5xl
					`}
				>
					Game is about to start!
				</motion.h1>

				{/* Instructions - 3 key points with icons */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.2 }}
					className={`
						grid w-full gap-4
						sm:grid-cols-3
					`}
				>
					{/* Instruction 1 */}
					<div
						className={`
							flex flex-col items-center justify-between rounded-xl border-2
							border-black bg-white p-5 shadow-brutal
						`}
					>
						<div className="mb-3 flex h-10 items-center justify-center">
							<div
								className="
									relative size-12 rounded-lg border-2 border-black shadow-brutal-sm
								"
							>
								{shapeColors.map((color, index) => {
									const row = Math.floor(index / 2);
									const col = index % 2;
									return (
										<div
											key={index}
											className={cn('absolute flex items-center justify-center', color)}
											style={{
												top: `calc(${row * 50}%)`,
												left: `calc(${col * 50}%)`,
												width: '50%',
												height: '50%',
											}}
										>
											<svg viewBox="0 0 24 24" className="size-3 fill-white">
												<path d={shapePaths[index]} />
											</svg>
										</div>
									);
								})}
							</div>
						</div>
						<p className="mt-auto text-center text-lg font-bold">Tap the shape to answer</p>
					</div>

					{/* Instruction 2 */}
					<div
						className={`
							flex flex-col items-center justify-between rounded-xl border-2
							border-black bg-white p-5 shadow-brutal
						`}
					>
						<div
							className={`
								mb-3 flex size-12 items-center justify-center rounded-lg border-2
								border-black bg-quiz-orange shadow-brutal-sm
							`}
						>
							<Clock className="size-6 text-white" />
						</div>
						<p className="mt-auto text-center text-lg font-bold">Faster = More points</p>
					</div>

					{/* Instruction 3 */}
					<div
						className={`
							flex flex-col items-center justify-between rounded-xl border-2
							border-black bg-white p-5 shadow-brutal
						`}
					>
						<div
							className={`
								mb-3 flex size-12 items-center justify-center rounded-lg border-2
								border-black bg-yellow-400 shadow-brutal-sm
							`}
						>
							<Trophy className="size-6 text-black" />
						</div>
						<p className="mt-auto text-center text-lg font-bold">{totalQuestions} questions total</p>
					</div>
				</motion.div>

				{/* Countdown circle */}
				<div className="my-12">
					<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.3 }} className={`relative`}>
						{/* Pulse rings */}
						<div
							className={`
								absolute inset-0 animate-[pulse-ring_1s_ease-out_infinite] rounded-full
								border-4 border-black
							`}
							style={{ animationFillMode: 'forwards' }}
						/>
						<div
							className={`
								absolute inset-0 animate-[pulse-ring-outer_1s_ease-out_infinite_0.3s]
								rounded-full border-4 border-black
							`}
							style={{ animationFillMode: 'forwards' }}
						/>

						{/* Main countdown circle */}
						<div
							className={`
								flex size-36 items-center justify-center rounded-full border-4
								border-black bg-quiz-orange shadow-brutal-lg
								sm:size-44
							`}
						>
							<AnimatePresence mode="wait">
								<motion.span
									key={countdown}
									initial={{ scale: 1.5, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									exit={{ scale: 0.5, opacity: 0 }}
									transition={{ type: 'spring', stiffness: 400, damping: 20 }}
									className={`
										font-display text-7xl font-bold text-white
										sm:text-8xl
									`}
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
					className={`
						my-4 flex items-center gap-2 rounded-lg border-2 border-black
						bg-yellow-300 px-4 py-2 font-bold shadow-brutal-sm
					`}
				>
					<Zap className="size-6 fill-black text-black" />
					<span className="text-lg">Watch for 2× point rounds!</span>
				</motion.div>
			</div>
		</div>
	);
}
