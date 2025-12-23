import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import type { QuestionModifier } from '@shared/types';

interface HostQuestionModifierProps {
	questionIndex: number;
	totalQuestions: number;
	modifiers: QuestionModifier[];
}

// Pre-generated sparkle positions (generated once at module load, not during render)
const SPARKLE_POSITIONS = Array.from({ length: 20 }, (_, i) => ({
	left: `${(((i * 7919) % 100) + ((i * 104729) % 100) / 100) % 100}%`,
	top: `${(((i * 7907) % 100) + ((i * 104723) % 100) / 100) % 100}%`,
	delay: ((i * 7901) % 200) / 100,
}));

function DoublePointsAnimation() {
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
			{SPARKLE_POSITIONS.map((pos, i) => (
				<motion.div
					key={`sparkle-${i}`}
					className="absolute h-2 w-2 rounded-full bg-yellow-200"
					style={{
						left: pos.left,
						top: pos.top,
					}}
					initial={{ opacity: 0, scale: 0 }}
					animate={{
						opacity: [0, 1, 0],
						scale: [0, 1.5, 0],
					}}
					transition={{
						duration: 1,
						delay: pos.delay,
						repeat: Infinity,
					}}
				/>
			))}
		</motion.div>
	);
}

export function HostQuestionModifier({ questionIndex, totalQuestions, modifiers }: HostQuestionModifierProps) {
	// For now, only support double points modifier
	// Future modifiers can be added here with their own animations
	const hasDoublePoints = modifiers.includes('doublePoints');

	if (hasDoublePoints) {
		return <DoublePointsAnimation />;
	}

	// Fallback for unknown modifiers (shouldn't happen)
	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="text-2xl font-bold">
				Question {questionIndex + 1}/{totalQuestions}
			</div>
		</div>
	);
}
