import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { shapeGradients, shapePaths } from '@/components/game/shared';
import { cn } from '@/lib/utilities';

interface PlayerAnswerScreenProperties {
	onAnswer: (index: number) => void;
	submittedAnswer: number | undefined;
	optionIndices: number[];
}

function getPosition(displayIndex: number) {
	const row = Math.floor(displayIndex / 2);
	const col = displayIndex % 2;
	return {
		top: `calc(${row * 50}% + 6px)`,
		left: `calc(${col * 50}% + 6px)`,
	};
}

export function PlayerAnswerScreen({ onAnswer, submittedAnswer, optionIndices }: PlayerAnswerScreenProperties) {
	const [showPulse, setShowPulse] = useState(false);

	// Trigger pulse animation after selection
	useEffect(() => {
		if (submittedAnswer !== undefined) {
			const timer = setTimeout(() => setShowPulse(true), 600);
			return () => clearTimeout(timer);
		}
		// No need to setShowPulse(false) - state is initialized as false,
		// and render guards (isSelected && showPulse) prevent showing pulse when submittedAnswer is null
	}, [submittedAnswer]);

	const canAnswer = submittedAnswer === undefined;

	return (
		<div
			className={`
				relative h-[calc(100vh-10rem)] max-h-[500px] w-[calc(100vw-2rem)] max-w-2xl
				overflow-hidden
			`}
		>
			{/* Answer buttons */}
			{optionIndices.map((originalIndex, displayIndex) => {
				const isSelected = submittedAnswer === originalIndex;
				const isOther = submittedAnswer !== undefined && !isSelected;
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
										scale: 1.02,
										y: -2,
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
						className={cn(
							`
								group absolute flex items-center justify-center rounded-xl border-4
								border-black
							`,
							canAnswer ? 'cursor-pointer overflow-hidden' : 'cursor-not-allowed overflow-hidden',
							isSelected && 'overflow-visible',
							`
								focus-visible:ring-4 focus-visible:ring-white/70
								focus-visible:ring-offset-2 focus-visible:ring-offset-black/20
								focus-visible:outline-none
							`,
						)}
						style={{
							top: pos.top,
							left: pos.left,
							width: 'calc(50% - 12px)',
							height: 'calc(50% - 12px)',
							background: shapeGradients[originalIndex],
							boxShadow: '0px 4px 0px 0px rgba(0,0,0,1)',
						}}
					>
						{/* Inner glow */}
						<motion.div
							className={`
								absolute inset-0 rounded-xl bg-linear-to-t from-transparent
								via-transparent to-white/10
							`}
							animate={isSelected && showPulse ? { opacity: [0.1, 0.3, 0.1] } : {}}
							transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
						/>

						{/* Selection ring effect - fades out after initial pop */}
						{isSelected && (
							<motion.div
								initial={{ opacity: 0, scale: 0.8 }}
								animate={{ opacity: [0, 1, 0], scale: [0.8, 1, 1.05] }}
								transition={{ duration: 1, ease: 'easeOut', times: [0, 0.4, 1] }}
								className={`
									absolute inset-0 rounded-xl ring-4 ring-white/50 ring-offset-4
									ring-offset-transparent
								`}
							/>
						)}

						{/* Shape icon */}
						<motion.svg
							viewBox="0 0 24 24"
							className={`
								size-1/2 fill-current stroke-black/35 stroke-[1.5] text-white
								drop-shadow-lg
								[paint-order:stroke]
							`}
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

						{/* Shimmer effect on hover - uses CSS for parent hover detection */}
						{canAnswer && (
							<div
								className={`
									pointer-events-none absolute inset-0 -translate-x-full -skew-x-12
									bg-linear-to-r from-transparent via-white/25 to-transparent
									transition-transform duration-500 ease-out
									group-hover:translate-x-full
								`}
							/>
						)}

						{/* Sparkle particles for selected */}
						{isSelected && showPulse && (
							<>
								{Array.from({ length: 6 }).map((_, index) => (
									<motion.div
										key={index}
										className="absolute size-2 rounded-full bg-white"
										initial={{
											x: 0,
											y: 0,
											opacity: 1,
											scale: 0,
										}}
										animate={{
											x: Math.cos((index * Math.PI * 2) / 6) * 100,
											y: Math.sin((index * Math.PI * 2) / 6) * 100,
											opacity: [1, 0],
											scale: [0, 1, 0],
										}}
										transition={{
											duration: 1,
											delay: 0.6 + index * 0.1,
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
