import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { shapeGradients, shapePaths } from '@/components/game/shared';

interface PlayerAnswerScreenProps {
	onAnswer: (index: number) => void;
	submittedAnswer: number | null;
	optionIndices: number[];
}

export function PlayerAnswerScreen({ onAnswer, submittedAnswer, optionIndices }: PlayerAnswerScreenProps) {
	const [showPulse, setShowPulse] = useState(false);

	// Trigger pulse animation after selection
	useEffect(() => {
		if (submittedAnswer !== null) {
			const timer = setTimeout(() => setShowPulse(true), 600);
			return () => clearTimeout(timer);
		}
		// No need to setShowPulse(false) - state is initialized as false,
		// and render guards (isSelected && showPulse) prevent showing pulse when submittedAnswer is null
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

	const canAnswer = submittedAnswer === null;

	return (
		<div className="relative h-[calc(100vh-10rem)] max-h-[500px] w-[calc(100vw-2rem)] max-w-2xl overflow-hidden">
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
