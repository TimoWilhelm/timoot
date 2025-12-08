import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';
import { shapeColors, shapePaths } from '@/components/game/shapes';

interface CountdownTimerProps {
	timeLeft: number;
	totalTime: number;
}

function CountdownTimer({ timeLeft, totalTime }: CountdownTimerProps) {
	const progress = timeLeft / totalTime;
	const isUrgent = timeLeft <= 5;
	const isCritical = timeLeft <= 3;

	// Circle properties
	const size = 120;
	const strokeWidth = 8;
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;
	const strokeDashoffset = circumference * (1 - progress);

	// Color transitions based on time remaining
	const getColor = () => {
		if (timeLeft <= 3) return { stroke: '#dc2626', text: 'text-red-600', glow: 'rgba(220, 38, 38, 0.5)' };
		if (timeLeft <= 5) return { stroke: '#f59e0b', text: 'text-amber-500', glow: 'rgba(245, 158, 11, 0.4)' };
		if (timeLeft <= 10) return { stroke: '#eab308', text: 'text-yellow-500', glow: 'rgba(234, 179, 8, 0.3)' };
		return { stroke: '#22c55e', text: 'text-green-500', glow: 'rgba(34, 197, 94, 0.3)' };
	};

	const colors = getColor();

	return (
		<motion.div
			className="relative"
			animate={
				isCritical
					? {
							scale: [1, 1.05, 1],
							rotate: [-1, 1, -1],
						}
					: isUrgent
						? { scale: [1, 1.02, 1] }
						: {}
			}
			transition={
				isCritical
					? { duration: 0.3, repeat: Infinity, ease: 'easeInOut' }
					: isUrgent
						? { duration: 0.5, repeat: Infinity, ease: 'easeInOut' }
						: {}
			}
		>
			{/* Glow effect for urgency */}
			<AnimatePresence>
				{isUrgent && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: [0.5, 1, 0.5] }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
						className="absolute inset-0 rounded-full"
						style={{
							boxShadow: `0 0 ${isCritical ? '40px' : '25px'} ${colors.glow}`,
						}}
					/>
				)}
			</AnimatePresence>

			{/* Background circle container */}
			<div className="relative flex items-center justify-center rounded-full bg-white shadow-lg" style={{ width: size, height: size }}>
				{/* SVG Progress Ring */}
				<svg className="absolute inset-0 -rotate-90" width={size} height={size}>
					{/* Background track */}
					<circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
					{/* Progress arc */}
					<motion.circle
						cx={size / 2}
						cy={size / 2}
						r={radius}
						fill="none"
						stroke={colors.stroke}
						strokeWidth={strokeWidth}
						strokeLinecap="round"
						strokeDasharray={circumference}
						initial={{ strokeDashoffset: 0 }}
						animate={{ strokeDashoffset }}
						transition={{ duration: 0.25, ease: 'linear' }}
					/>
				</svg>

				{/* Timer number */}
				<AnimatePresence mode="wait">
					<motion.span
						key={timeLeft}
						initial={{ scale: 1.4, opacity: 0, y: -10 }}
						animate={{ scale: 1, opacity: 1, y: 0 }}
						exit={{ scale: 0.8, opacity: 0, y: 10 }}
						transition={{ type: 'spring', stiffness: 500, damping: 30 }}
						className={`text-4xl font-bold tabular-nums sm:text-5xl ${colors.text} transition-colors duration-300`}
					>
						{timeLeft}
					</motion.span>
				</AnimatePresence>
			</div>

			{/* Pulse rings for critical time */}
			<AnimatePresence>
				{isCritical && (
					<>
						<motion.div
							initial={{ scale: 1, opacity: 0.6 }}
							animate={{ scale: 1.5, opacity: 0 }}
							transition={{ duration: 1, repeat: Infinity, ease: 'easeOut' }}
							className="absolute inset-0 rounded-full border-2 border-red-500"
						/>
						<motion.div
							initial={{ scale: 1, opacity: 0.4 }}
							animate={{ scale: 1.8, opacity: 0 }}
							transition={{ duration: 1, repeat: Infinity, ease: 'easeOut', delay: 0.3 }}
							className="absolute inset-0 rounded-full border-2 border-red-400"
						/>
					</>
				)}
			</AnimatePresence>
		</motion.div>
	);
}

// Double Points Animation Component
function DoublePointsAnimation({ onComplete }: { onComplete: () => void }) {
	useEffect(() => {
		const timer = setTimeout(onComplete, 2500);
		return () => clearTimeout(timer);
	}, [onComplete]);

	return (
		<motion.div
			className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-quiz-orange/90 to-amber-600/90"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.3 }}
		>
			{/* Background pulse rings */}
			{[...Array(3)].map((_, i) => (
				<motion.div
					key={i}
					className="absolute rounded-full border-4 border-white/30"
					initial={{ width: 100, height: 100, opacity: 0.8 }}
					animate={{
						width: [100, 600],
						height: [100, 600],
						opacity: [0.8, 0],
					}}
					transition={{
						duration: 1.5,
						delay: i * 0.3,
						repeat: Infinity,
						ease: 'easeOut',
					}}
				/>
			))}

			{/* Lightning bolts */}
			{[...Array(8)].map((_, i) => (
				<motion.div
					key={`bolt-${i}`}
					className="absolute"
					style={{
						transform: `rotate(${i * 45}deg) translateY(-150px)`,
					}}
					initial={{ opacity: 0, scale: 0 }}
					animate={{
						opacity: [0, 1, 0],
						scale: [0.5, 1.2, 0.8],
					}}
					transition={{
						duration: 0.6,
						delay: 0.5 + i * 0.08,
						repeat: 2,
					}}
				>
					<Zap className="h-12 w-12 fill-yellow-300 text-yellow-300" />
				</motion.div>
			))}

			{/* Main 2x text */}
			<motion.div
				className="relative flex flex-col items-center"
				initial={{ scale: 0, rotate: -180 }}
				animate={{ scale: 1, rotate: 0 }}
				transition={{
					type: 'spring',
					stiffness: 200,
					damping: 15,
					delay: 0.2,
				}}
			>
				<motion.div
					className="text-[12rem] font-black leading-none text-white drop-shadow-2xl"
					animate={{
						scale: [1, 1.1, 1],
						textShadow: ['0 0 20px rgba(255,255,255,0.5)', '0 0 60px rgba(255,255,255,0.8)', '0 0 20px rgba(255,255,255,0.5)'],
					}}
					transition={{ duration: 0.5, repeat: Infinity }}
				>
					2×
				</motion.div>
				<motion.div
					className="text-4xl font-bold uppercase tracking-widest text-white/90"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.6 }}
				>
					Double Points!
				</motion.div>
			</motion.div>

			{/* Sparkle particles */}
			{[...Array(20)].map((_, i) => (
				<motion.div
					key={`sparkle-${i}`}
					className="absolute h-2 w-2 rounded-full bg-yellow-200"
					style={{
						left: `${Math.random() * 100}%`,
						top: `${Math.random() * 100}%`,
					}}
					initial={{ opacity: 0, scale: 0 }}
					animate={{
						opacity: [0, 1, 0],
						scale: [0, 1.5, 0],
					}}
					transition={{
						duration: 1,
						delay: Math.random() * 2,
						repeat: Infinity,
					}}
				/>
			))}
		</motion.div>
	);
}

// 2x Badge component for during the question - displayed in header
function DoublePointsBadge() {
	return (
		<motion.div
			initial={{ scale: 0, x: 20 }}
			animate={{ scale: 1, x: 0 }}
			transition={{ type: 'spring', stiffness: 300, damping: 20 }}
			className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-quiz-orange to-amber-500 px-4 py-2 text-white shadow-lg"
		>
			<motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}>
				<Zap className="h-7 w-7 fill-current sm:h-8 sm:w-8" />
			</motion.div>
			<span className="text-xl font-bold sm:text-2xl">2× Points</span>
		</motion.div>
	);
}

interface HostQuestionProps {
	onNext: () => void;
	questionText: string;
	options: string[];
	questionIndex: number;
	totalQuestions: number;
	startTime: number;
	timeLimitMs: number;
	answeredCount: number;
	totalPlayers: number;
	isDoublePoints?: boolean;
	backgroundImage?: string;
}

export function HostQuestion({
	onNext,
	questionText,
	options,
	questionIndex,
	totalQuestions,
	startTime,
	timeLimitMs,
	answeredCount,
	totalPlayers,
	isDoublePoints,
	backgroundImage,
}: HostQuestionProps) {
	const timeLimitSec = timeLimitMs / 1000;
	const [timeLeft, setTimeLeft] = useState(timeLimitSec);
	const [showDoublePointsAnimation, setShowDoublePointsAnimation] = useState(isDoublePoints ?? false);
	const [imageError, setImageError] = useState(false);

	// Reset image error state when backgroundImage changes
	useEffect(() => {
		setImageError(false);
	}, [backgroundImage]);

	useEffect(() => {
		// Don't start timer until animation is done
		if (showDoublePointsAnimation) return;

		const timer = setInterval(() => {
			const elapsedMs = Date.now() - startTime;
			const elapsedSeconds = Math.floor(elapsedMs / 1000);
			const remaining = Math.max(0, timeLimitSec - elapsedSeconds);
			setTimeLeft(remaining);
			if (elapsedMs >= timeLimitMs) {
				clearInterval(timer);
				onNext();
			}
		}, 100);
		return () => clearInterval(timer);
	}, [startTime, timeLimitSec, timeLimitMs, onNext, showDoublePointsAnimation]);
	// Show fullscreen animation for 2x questions
	if (showDoublePointsAnimation) {
		return <DoublePointsAnimation onComplete={() => setShowDoublePointsAnimation(false)} />;
	}

	return (
		<div className="flex flex-grow flex-col p-4 sm:p-8">
			<div className="mb-4 flex items-center justify-between">
				<div className="flex flex-col">
					<span className="text-xl font-bold sm:text-2xl">
						Question {questionIndex + 1}/{totalQuestions}
					</span>
					<span className="text-sm text-muted-foreground">
						{answeredCount}/{totalPlayers} answered
					</span>
				</div>
				<div className="flex items-center gap-4">
					{isDoublePoints && <DoublePointsBadge />}
					<CountdownTimer timeLeft={timeLeft} totalTime={timeLimitSec} />
				</div>
			</div>
			<div className="center relative mb-4 flex-grow overflow-hidden rounded-2xl shadow-lg sm:mb-8">
				{/* Fallback white background layer (always present) */}
				<div className="absolute inset-0 bg-white" />
				{/* Background image layer (layered on top, hidden if error) */}
				{backgroundImage && !imageError && (
					<img src={backgroundImage} alt="" className="absolute inset-0 h-full w-full object-cover" onError={() => setImageError(true)} />
				)}
				{/* Content layer */}
				<div className="relative z-10 flex h-full w-full items-center justify-center p-4 sm:p-8">
					<div
						className={`rounded-xl px-6 py-4 sm:px-10 sm:py-6 ${backgroundImage && !imageError ? 'bg-white/85 shadow-xl backdrop-blur-lg' : ''}`}
					>
						<h2 className="text-center text-3xl font-bold text-gray-900 sm:text-5xl">{questionText}</h2>
					</div>
				</div>
			</div>
			<div className="grid grid-cols-1 gap-2 sm:gap-4 md:grid-cols-2">
				{options.map((option, i) => (
					<motion.div
						key={i}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: i * 0.1 }}
						className={`flex items-center rounded-2xl p-4 text-xl font-bold text-white shadow-md sm:p-6 sm:text-3xl ${shapeColors[i]}`}
					>
						<svg viewBox="0 0 24 24" className="mr-4 h-8 w-8 fill-current sm:h-12 sm:w-12">
							<path d={shapePaths[i]} />
						</svg>
						{option}
					</motion.div>
				))}
			</div>
		</div>
	);
}
