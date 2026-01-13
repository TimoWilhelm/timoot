import { Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { useHostGameContext } from '@/features/game/host/host-game-context';
import { shapeColors, shapePaths } from '@/features/game/shared/shapes';
import { cn } from '@/lib/utilities';

interface CountdownTimerProperties {
	timeLeft: number;
	totalTime: number;
}

function CountdownTimer({ timeLeft, totalTime }: CountdownTimerProperties) {
	const isUrgent = timeLeft <= 5;
	const isCritical = timeLeft <= 3;
	const progress = Math.min(timeLeft / totalTime, 1);
	const circumference = 2 * Math.PI * 26;
	const strokeDashoffset = circumference * (1 - progress);

	const getColors = () => {
		if (timeLeft <= 3) return { bg: 'bg-red', border: 'border-red-dark', text: 'text-white' };
		if (timeLeft <= 5) return { bg: 'bg-orange', border: 'border-orange-dark', text: 'text-black' };
		if (timeLeft <= 10) return { bg: 'bg-yellow', border: 'border-yellow-dark', text: 'text-black' };
		return { bg: 'bg-green', border: 'border-green-dark', text: 'text-black' };
	};

	const colors = getColors();

	return (
		<motion.div
			className="relative"
			animate={isCritical ? { scale: [1, 1.05, 1], rotate: [-1, 1, -1] } : isUrgent ? { scale: [1, 1.02, 1] } : {}}
			transition={
				isCritical
					? { duration: 0.3, repeat: Infinity, ease: 'easeInOut' }
					: isUrgent
						? { duration: 0.5, repeat: Infinity, ease: 'easeInOut' }
						: {}
			}
		>
			{/* Neo Brutalist timer circle */}
			<div
				className={cn(
					`
						relative flex size-16 items-center justify-center rounded-full
						border-[3px] border-black shadow-brutal-sm transition-colors duration-300
						sm:size-20
					`,
					colors.bg,
				)}
			>
				{/* Progress ring */}
				<svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 64 64">
					<circle cx="32" cy="32" r="26" fill="none" stroke="none" strokeWidth="4" />
					<motion.circle
						cx="32"
						cy="32"
						r="26"
						fill="none"
						strokeWidth="4"
						strokeLinecap="round"
						strokeDasharray={circumference}
						animate={{ strokeDashoffset, stroke: 'rgba(0,0,0,0.33)' }}
						transition={{ strokeDashoffset: { duration: 0.1, ease: 'linear' }, stroke: { duration: 0.3 } }}
					/>
				</svg>

				{/* Timer number */}
				<AnimatePresence mode="wait" initial={false}>
					<motion.span
						key={timeLeft}
						initial={{ scale: 0.8, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 1.1, opacity: 0 }}
						transition={{ duration: 0.12 }}
						className={cn(
							colors.text,
							`
								relative font-display text-2xl font-black tabular-nums
								sm:text-3xl
							`,
						)}
					>
						{timeLeft}
					</motion.span>
				</AnimatePresence>
			</div>

			{/* Pulse ring for critical time */}
			<AnimatePresence>
				{isCritical && (
					<motion.div
						initial={{ scale: 1, opacity: 0.6 }}
						animate={{ scale: 1.3, opacity: 0 }}
						transition={{ duration: 0.6, repeat: Infinity, ease: 'easeOut' }}
						className={cn('absolute inset-0 rounded-full border-[3px]', colors.border)}
					/>
				)}
			</AnimatePresence>
		</motion.div>
	);
}

// 2x Badge component for during the question - displayed in header
// Compact on mobile (just icon + 2×), full on larger screens (2× Points)
function DoublePointsBadge() {
	return (
		<motion.div
			initial={{ scale: 0, x: 20 }}
			animate={{ scale: 1, x: 0 }}
			transition={{ type: 'spring', stiffness: 300, damping: 20 }}
			className={`
				flex items-center gap-1 rounded-lg border-2 border-black bg-orange px-2 py-1
				text-white shadow-brutal-sm
				sm:gap-2 sm:border-4 sm:px-4 sm:py-2
			`}
		>
			<motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}>
				<Zap
					className={`
						size-5 fill-current
						sm:size-8
					`}
				/>
			</motion.div>
			<span
				className={`
					text-base font-black uppercase
					sm:text-2xl
				`}
			>
				<span className="sm:hidden">2×</span>
				<span
					className={`
						hidden
						sm:inline
					`}
				>
					2× Points
				</span>
			</span>
		</motion.div>
	);
}

export function HostQuestion() {
	const { gameState, onNextState, onPlaySound, onPlayCountdownTick } = useHostGameContext();
	const {
		questionText,
		options,
		questionIndex,
		totalQuestions,
		startTime,
		timeLimitMs,
		answeredCount,
		players,
		isDoublePoints,
		backgroundImage,
	} = gameState;

	const totalPlayers = players.length;
	const onTimeUp = () => onPlaySound('timeUp');
	const timeLimitSec = timeLimitMs / 1000;
	const [timeLeft, setTimeLeft] = useState(timeLimitSec);
	const [imageError, setImageError] = useState(false);
	const [previousBackgroundImage, setPreviousBackgroundImage] = useState(backgroundImage);

	// Reset image error state when backgroundImage changes (adjusting state during render)
	if (backgroundImage !== previousBackgroundImage) {
		setPreviousBackgroundImage(backgroundImage);
		setImageError(false);
	}

	// Use refs for callbacks to prevent effect restart on parent re-renders
	const onNextReference = useRef(onNextState);
	const onCountdownTickReference = useRef(onPlayCountdownTick);
	const onTimeUpReference = useRef(onTimeUp);

	useEffect(() => {
		onNextReference.current = onNextState;
		onCountdownTickReference.current = onPlayCountdownTick;
		onTimeUpReference.current = onTimeUp;
	});

	useEffect(() => {
		let lastTickedSecond = -1;
		const timer = setInterval(() => {
			const elapsedMs = Date.now() - startTime;
			const elapsedSeconds = Math.floor(elapsedMs / 1000);
			const remaining = Math.max(0, timeLimitSec - elapsedSeconds);
			setTimeLeft(remaining);

			// Play countdown tick sounds (once per second change)
			if (remaining !== lastTickedSecond && remaining <= 5 && remaining > 0) {
				onCountdownTickReference.current?.(remaining);
				lastTickedSecond = remaining;
			}

			if (elapsedMs >= timeLimitMs) {
				clearInterval(timer);
				onTimeUpReference.current?.();
				onNextReference.current();
			}
		}, 100);
		return () => clearInterval(timer);
	}, [startTime, timeLimitSec, timeLimitMs]);

	return (
		<div
			className={`
				flex h-full max-h-screen grow flex-col overflow-y-auto p-4
				sm:p-8
			`}
		>
			<div className="mb-4 flex items-center justify-between">
				<div
					className={`
						flex flex-col rounded-lg border-4 border-black bg-white px-4 py-2
						shadow-brutal-sm
					`}
				>
					<span
						className={`
							font-display text-xl font-black text-black
							sm:text-2xl
						`}
					>
						Question {questionIndex + 1}/{totalQuestions}
					</span>
					<span className="text-sm font-bold text-muted-foreground">
						{answeredCount}/{totalPlayers} answered
					</span>
				</div>
				<div className="flex items-center gap-4">
					{isDoublePoints && <DoublePointsBadge />}
					<CountdownTimer timeLeft={timeLeft} totalTime={timeLimitSec} />
				</div>
			</div>
			<div
				className={`
					relative mb-4 flex min-h-32 shrink-0 grow flex-col items-center
					justify-center overflow-hidden rounded-xl border-4 border-black
					shadow-brutal
					sm:mb-8
				`}
			>
				{/* Fallback white background layer (always present) */}
				<div className="absolute inset-0 bg-white" />
				{/* Background image layer (layered on top, hidden if error) */}
				{backgroundImage && !imageError && (
					<img src={backgroundImage} alt="" className={`absolute inset-0 size-full object-cover`} onError={() => setImageError(true)} />
				)}

				{/* Content layer */}
				<div
					className={`
						relative flex w-full items-center justify-center p-4
						sm:p-8
					`}
				>
					<div
						className={cn(
							`
								rounded-lg px-6 py-4
								sm:px-10 sm:py-6
							`,
							backgroundImage && !imageError && `border-4 border-black bg-white/75 shadow-brutal-sm backdrop-blur-sm`,
						)}
					>
						<h2
							className={`
								text-center text-3xl font-bold text-black
								sm:text-5xl
							`}
						>
							{questionText}
						</h2>
					</div>
				</div>
			</div>
			<div
				className={`
					grid grid-cols-1 gap-2
					sm:gap-4
					md:grid-cols-2
				`}
			>
				{options.map((option, index) => (
					<motion.div
						key={index}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: index * 0.1 }}
						className={cn(
							`
								flex items-center rounded-xl border-4 border-black p-4 text-xl font-bold
								shadow-brutal-sm
								sm:p-6 sm:text-3xl
							`,
							shapeColors[index],
						)}
					>
						<svg
							viewBox="0 0 24 24"
							className={`
								mr-4 size-8 fill-current stroke-black/35 stroke-3 text-white
								drop-shadow-lg [paint-order:stroke]
								sm:size-12
							`}
						>
							<path d={shapePaths[index]} />
						</svg>
						<span>{option}</span>
					</motion.div>
				))}
			</div>
		</div>
	);
}
