import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import { shapePaths, shapeGradients, shapeGlowColors } from '@/components/game/shapes';

// Compact 2x animation for player screen
function PlayerDoublePointsAnimation({ onComplete }: { onComplete: () => void }) {
	useEffect(() => {
		const timer = setTimeout(onComplete, 2500);
		return () => clearTimeout(timer);
	}, [onComplete]);

	return (
		<motion.div
			className="absolute inset-0 z-50 flex select-none items-center justify-center rounded-2xl bg-gradient-to-br from-quiz-orange/95 to-amber-600/95"
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 1.1 }}
			transition={{ duration: 0.3 }}
		>
			{/* Pulse rings */}
			{[...Array(3)].map((_, i) => (
				<motion.div
					key={i}
					className="absolute rounded-full border-2 border-white/30"
					initial={{ width: 50, height: 50, opacity: 0.8 }}
					animate={{
						width: [50, 300],
						height: [50, 300],
						opacity: [0.8, 0],
					}}
					transition={{
						duration: 1.2,
						delay: i * 0.25,
						repeat: Infinity,
						ease: 'easeOut',
					}}
				/>
			))}

			{/* Lightning bolts */}
			{[...Array(6)].map((_, i) => (
				<motion.div
					key={`bolt-${i}`}
					className="absolute"
					style={{
						transform: `rotate(${i * 60}deg) translateY(-80px)`,
					}}
					initial={{ opacity: 0, scale: 0 }}
					animate={{
						opacity: [0, 1, 0],
						scale: [0.5, 1, 0.8],
					}}
					transition={{
						duration: 0.5,
						delay: 0.4 + i * 0.06,
						repeat: 2,
					}}
				>
					<Zap className="h-8 w-8 fill-yellow-300 text-yellow-300" />
				</motion.div>
			))}

			{/* Main content */}
			<motion.div
				className="relative flex flex-col items-center"
				initial={{ scale: 0, rotate: -180 }}
				animate={{ scale: 1, rotate: 0 }}
				transition={{
					type: 'spring',
					stiffness: 200,
					damping: 15,
					delay: 0.15,
				}}
			>
				<motion.div
					className="text-8xl font-black leading-none text-white drop-shadow-xl"
					animate={{ scale: [1, 1.1, 1] }}
					transition={{ duration: 0.5, repeat: Infinity }}
				>
					2×
				</motion.div>
				<motion.div
					className="mt-2 text-xl font-bold uppercase tracking-wider text-white/90"
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.5 }}
				>
					Double Points!
				</motion.div>
			</motion.div>
		</motion.div>
	);
}

interface PlayerAnswerScreenProps {
	onAnswer: (index: number) => void;
	submittedAnswer: number | null;
	optionIndices: number[];
	isDoublePoints?: boolean;
}

export function PlayerAnswerScreen({ onAnswer, submittedAnswer, optionIndices, isDoublePoints }: PlayerAnswerScreenProps) {
	const [showPulse, setShowPulse] = useState(false);
	const [showDoublePointsAnimation, setShowDoublePointsAnimation] = useState(isDoublePoints ?? false);

	// Trigger pulse animation after selection
	useEffect(() => {
		if (submittedAnswer !== null) {
			const timer = setTimeout(() => setShowPulse(true), 600);
			return () => clearTimeout(timer);
		}
		setShowPulse(false);
	}, [submittedAnswer]);

	// Calculate positions for 2x2 grid with rectangular buttons (wider horizontally)
	const getPosition = (displayIndex: number) => {
		const row = Math.floor(displayIndex / 2);
		const col = displayIndex % 2;
		return {
			top: `calc(${row * 50}% + 6px)`,
			left: `calc(${col * 50}% + 6px)`,
		};
	};

	// Don't allow answering while animation is playing
	const canAnswer = !showDoublePointsAnimation && submittedAnswer === null;

	return (
		<div className="relative h-[calc(100vh-10rem)] max-h-[500px] w-[calc(100vw-2rem)] max-w-2xl overflow-hidden">
			{/* 2x Points animation overlay */}
			<AnimatePresence>
				{showDoublePointsAnimation && <PlayerDoublePointsAnimation onComplete={() => setShowDoublePointsAnimation(false)} />}
			</AnimatePresence>

			{/* Background glow effect when selected */}
			<AnimatePresence>
				{submittedAnswer !== null && (
					<motion.div
						initial={{ opacity: 0, scale: 0 }}
						animate={{ opacity: 0.4, scale: 3 }}
						transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
						className="pointer-events-none absolute rounded-full blur-3xl"
						style={{
							left: '25%',
							top: '25%',
							width: '50%',
							height: '50%',
							background: `radial-gradient(circle, ${shapeGlowColors[submittedAnswer]} 0%, transparent 70%)`,
						}}
					/>
				)}
			</AnimatePresence>

			{/* Answer buttons */}
			{optionIndices.map((originalIndex, displayIndex) => {
				const isSelected = submittedAnswer === originalIndex;
				const isOther = submittedAnswer !== null && !isSelected;
				const pos = getPosition(displayIndex);

				return (
					<motion.button
						key={originalIndex}
						onClick={() => canAnswer && onAnswer(originalIndex)}
						disabled={!canAnswer}
						initial={{ opacity: 0, scale: 0.8 }}
						animate={
							isSelected
								? {
										opacity: 1,
										scale: 1,
										top: '10%',
										left: '10%',
										width: '80%',
										height: '80%',
										zIndex: 50,
										rotate: 0,
									}
								: isOther
									? {
											opacity: 0,
											scale: 0.3,
											rotate: displayIndex % 2 === 0 ? 20 : -20,
											zIndex: 1,
										}
									: {
											opacity: 1,
											scale: 1,
											top: pos.top,
											left: pos.left,
											width: 'calc(50% - 12px)',
											height: 'calc(50% - 12px)',
											zIndex: 1,
											rotate: 0,
										}
						}
						whileHover={
							canAnswer
								? {
										scale: 1.03,
										boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
									}
								: {}
						}
						whileTap={canAnswer ? { scale: 0.97 } : {}}
						transition={
							isSelected
								? {
										type: 'spring',
										stiffness: 180,
										damping: 22,
										mass: 1,
									}
								: isOther
									? {
											duration: 0.5,
											ease: [0.4, 0, 1, 1],
											delay: displayIndex * 0.03,
										}
									: {
											type: 'spring',
											stiffness: 500,
											damping: 28,
											delay: displayIndex * 0.03,
										}
						}
						className="absolute flex cursor-pointer items-center justify-center overflow-hidden rounded-2xl"
						style={{
							top: pos.top,
							left: pos.left,
							width: 'calc(50% - 12px)',
							height: 'calc(50% - 12px)',
							background: shapeGradients[originalIndex],
							boxShadow: '0 10px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
						}}
					>
						{/* Inner glow */}
						<motion.div
							className="absolute inset-0 rounded-2xl bg-gradient-to-t from-transparent via-transparent to-white/10"
							animate={isSelected && showPulse ? { opacity: [0.1, 0.3, 0.1] } : {}}
							transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
						/>

						{/* Selection ring effect */}
						{isSelected && (
							<motion.div
								initial={{ opacity: 0, scale: 0.8 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ delay: 0.3, duration: 0.5, ease: 'easeOut' }}
								className="absolute inset-0 rounded-2xl ring-4 ring-white/50 ring-offset-4 ring-offset-transparent"
							/>
						)}

						{/* Pulsing rings for selected button */}
						{isSelected && showPulse && (
							<>
								<motion.div
									initial={{ opacity: 0.6, scale: 1 }}
									animate={{ opacity: 0, scale: 1.3 }}
									transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
									className="absolute inset-0 rounded-2xl border-2 border-white/40"
								/>
								<motion.div
									initial={{ opacity: 0.4, scale: 1 }}
									animate={{ opacity: 0, scale: 1.5 }}
									transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
									className="absolute inset-0 rounded-2xl border-2 border-white/30"
								/>
							</>
						)}

						{/* Shape icon */}
						<motion.svg
							viewBox="0 0 24 24"
							className="h-1/2 w-1/2 fill-current text-white drop-shadow-lg"
							animate={
								isSelected
									? {
											scale: [1, 1.1, 1],
											rotate: [0, 5, -5, 0],
										}
									: {}
							}
							transition={
								isSelected
									? {
											duration: 0.6,
											delay: 0.4,
											ease: 'easeInOut',
										}
									: {}
							}
						>
							<path d={shapePaths[originalIndex]} />
						</motion.svg>

						{/* Shimmer effect on hover */}
						{canAnswer && (
							<motion.div
								className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent"
								initial={{ x: '-200%' }}
								whileHover={{ x: '200%' }}
								transition={{ duration: 0.6 }}
							/>
						)}

						{/* Sparkle particles for selected */}
						{isSelected && showPulse && (
							<>
								{[...Array(6)].map((_, i) => (
									<motion.div
										key={i}
										className="absolute h-2 w-2 rounded-full bg-white"
										initial={{
											x: 0,
											y: 0,
											opacity: 1,
											scale: 0,
										}}
										animate={{
											x: Math.cos((i * Math.PI * 2) / 6) * 100,
											y: Math.sin((i * Math.PI * 2) / 6) * 100,
											opacity: [1, 0],
											scale: [0, 1, 0],
										}}
										transition={{
											duration: 1,
											delay: 0.6 + i * 0.1,
											ease: 'easeOut',
										}}
									/>
								))}
							</>
						)}
					</motion.button>
				);
			})}
		</div>
	);
}
