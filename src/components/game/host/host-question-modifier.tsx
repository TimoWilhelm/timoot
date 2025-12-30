import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import type { QuestionModifier } from '@shared/types';

interface HostQuestionModifierProperties {
	questionIndex: number;
	totalQuestions: number;
	modifiers: QuestionModifier[];
}

// Pre-generated sparkle positions (generated once at module load, not during render)
const SPARKLE_POSITIONS = Array.from({ length: 20 }, (_, index) => ({
	left: `${(((index * 7919) % 100) + ((index * 104_729) % 100) / 100) % 100}%`,
	top: `${(((index * 7907) % 100) + ((index * 104_723) % 100) / 100) % 100}%`,
	delay: ((index * 7901) % 200) / 100,
}));

function DoublePointsAnimation() {
	return (
		<motion.div
			className="
				fixed inset-0 z-50 flex items-center justify-center bg-quiz-orange
			"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.3 }}
		>
			{/* Decorative grid background */}
			<div
				className={`
					absolute inset-0 bg-[radial-gradient(#00000015_1px,transparent_1px)]
					bg-size-[24px_24px]
				`}
			/>
			{/* Background pulse rings */}
			{Array.from({ length: 3 }).map((_, index) => (
				<motion.div
					key={index}
					className="absolute rounded-xl border-4 border-black/20"
					initial={{ width: 100, height: 100, opacity: 0.8 }}
					animate={{
						width: [100, 600],
						height: [100, 600],
						opacity: [0.8, 0],
					}}
					transition={{
						duration: 1.5,
						delay: index * 0.3,
						repeat: Infinity,
						ease: 'easeOut',
					}}
				/>
			))}

			{/* Lightning bolts */}
			{Array.from({ length: 8 }).map((_, index) => (
				<motion.div
					key={`bolt-${index}`}
					className="absolute"
					style={{
						transform: `rotate(${index * 45}deg) translateY(-150px)`,
					}}
					initial={{ opacity: 0, scale: 0 }}
					animate={{
						opacity: [0, 1, 0],
						scale: [0.5, 1.2, 0.8],
					}}
					transition={{
						duration: 0.6,
						delay: 0.5 + index * 0.08,
						repeat: 2,
					}}
				>
					<Zap className="size-12 fill-yellow-300 text-yellow-300" />
				</motion.div>
			))}

			{/* Main 2x text */}
			<motion.div
				className="relative z-10 flex flex-col items-center"
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
					className={`
						rounded-2xl border-8 border-black bg-white px-12 py-8
						shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]
					`}
					animate={{
						scale: [1, 1.05, 1],
					}}
					transition={{ duration: 0.5, repeat: Infinity }}
				>
					<div className="text-[10rem] leading-none font-black text-black">2×</div>
				</motion.div>
				<motion.div
					className={`
						mt-6 rounded-lg border-4 border-black bg-yellow-300 px-8 py-3 text-4xl
						font-black tracking-wider text-black uppercase
						shadow-[0px_6px_0px_0px_rgba(0,0,0,1)]
					`}
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.6 }}
				>
					Double Points!
				</motion.div>
			</motion.div>

			{/* Sparkle particles */}
			{SPARKLE_POSITIONS.map((pos, index) => (
				<motion.div
					key={`sparkle-${index}`}
					className="absolute size-3 rounded-sm border-2 border-black bg-white"
					style={{
						left: pos.left,
						top: pos.top,
					}}
					initial={{ opacity: 0, scale: 0, rotate: 0 }}
					animate={{
						opacity: [0, 1, 0],
						scale: [0, 1.5, 0],
						rotate: [0, 180, 360],
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

export function HostQuestionModifier({ questionIndex, totalQuestions, modifiers }: HostQuestionModifierProperties) {
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
