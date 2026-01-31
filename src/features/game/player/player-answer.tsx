import { motion } from 'motion/react';

import { usePlayerGameContext } from '@/features/game/player/player-game-context';
import { shapeColors, shapePaths } from '@/features/game/shared/shapes';
import { cn } from '@/lib/utilities';

function getPosition(displayIndex: number) {
	const row = Math.floor(displayIndex / 2);
	const col = displayIndex % 2;
	return {
		top: `calc(${row * 50}% + 6px)`,
		left: `calc(${col * 50}% + 6px)`,
	};
}

export function PlayerAnswer() {
	const { onAnswer, submittedAnswer, gameState } = usePlayerGameContext();
	const optionIndices = Array.from({ length: gameState.options.length }, (_, index) => index);
	// No pulse state needed for immediate reaction

	const canAnswer = submittedAnswer === undefined;

	return (
		<div
			className={`
				relative h-[calc(100vh-10rem)] max-h-125 w-[calc(100vw-2rem)] max-w-2xl
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
										stiffness: 400,
										damping: 25,
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
							shapeColors[originalIndex],
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
							boxShadow: '0px 4px 0px 0px rgba(0,0,0,1)',
						}}
					>
						{/* Inner glow */}
						<motion.div
							className={`
								absolute inset-0 rounded-xl bg-linear-to-t from-transparent
								via-transparent to-white/10
							`}
							animate={isSelected ? { opacity: [0.1, 0.3, 0.1] } : {}}
							transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
						/>

						<motion.svg
							viewBox="0 0 24 24"
							className={`
								size-1/2 fill-current stroke-black/35 stroke-[1.5] text-white
								drop-shadow-lg [paint-order:stroke]
							`}
							animate={
								isSelected
									? {
											scale: [1, 1.25, 1],
											rotate: [0, 10, -10, 0],
										}
									: {}
							}
							transition={
								isSelected
									? {
											duration: 0.4,
											delay: 0.2, // Wait for button to pop
											ease: 'backOut',
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

						{/* Confetti particles - Neo-Brutal Shapes */}
						{isSelected && (
							<>
								{Array.from({ length: 8 }).map((_, index) => (
									<motion.svg
										key={index}
										viewBox="0 0 24 24"
										className="absolute -z-10 size-4 fill-white stroke-black stroke-[3px]"
										style={{ filter: 'drop-shadow(2px 2px 0px rgba(0,0,0,1))' }}
										initial={{
											x: 0,
											y: 0,
											opacity: 1,
											scale: 0,
											rotate: 0,
										}}
										animate={{
											x: Math.cos((index * Math.PI * 2) / 8) * 220, // Increased distance
											y: Math.sin((index * Math.PI * 2) / 8) * 220,
											opacity: [1, 1, 0],
											scale: [0, 1.2, 0],
											rotate: [0, 180],
										}}
										transition={{
											duration: 0.8,
											delay: 0,
											ease: 'circOut',
										}}
									>
										<path d={shapePaths[originalIndex]} />
									</motion.svg>
								))}
							</>
						)}
					</motion.button>
				);
			})}
		</div>
	);
}
