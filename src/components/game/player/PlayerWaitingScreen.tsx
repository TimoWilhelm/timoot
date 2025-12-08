import { CheckCircle, XCircle, Loader2, Trophy, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState, useMemo } from 'react';
import type { GamePhase, QuestionModifier } from '@shared/types';

interface LeaderboardEntry {
	id: string;
	name: string;
	score: number;
	rank: number;
}

interface PlayerWaitingScreenProps {
	phase: GamePhase;
	answerResult: { isCorrect: boolean; score: number } | null;
	finalScore?: number;
	playerId: string | null;
	leaderboard?: LeaderboardEntry[];
	modifiers?: QuestionModifier[];
}

// Double Points animation for player screen
function PlayerDoublePointsAnimation() {
	return (
		<motion.div
			className="flex h-full w-full select-none flex-col items-center justify-center"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
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

// Confetti particle component
function ConfettiParticle({ delay, x, color }: { delay: number; x: number; color: string }) {
	return (
		<motion.div
			className="absolute h-3 w-3 rounded-sm"
			style={{ backgroundColor: color, left: `${x}%` }}
			initial={{ y: -20, opacity: 1, rotate: 0, scale: 1 }}
			animate={{
				y: ['0vh', '100vh'],
				opacity: [1, 1, 0],
				rotate: [0, 360, 720],
				x: [0, Math.random() * 40 - 20],
			}}
			transition={{
				duration: 3 + Math.random() * 2,
				delay,
				ease: 'easeOut',
			}}
		/>
	);
}

// Celebration confetti animation
function CelebrationConfetti() {
	const particles = useMemo(() => {
		const colors = ['#FBBF24', '#F59E0B', '#60A5FA', '#3B82F6', '#2DD4BF', '#14B8A6', '#F472B6', '#EC4899'];
		return Array.from({ length: 50 }, (_, i) => ({
			id: i,
			delay: Math.random() * 0.5,
			x: Math.random() * 100,
			color: colors[Math.floor(Math.random() * colors.length)],
		}));
	}, []);

	return (
		<div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
			{particles.map((p) => (
				<ConfettiParticle key={p.id} delay={p.delay} x={p.x} color={p.color} />
			))}
		</div>
	);
}

// Podium rank display component
function PodiumRankDisplay({ rank }: { rank: number }) {
	const config = {
		1: { color: 'text-yellow-400', label: '1st Place!', emoji: '🥇' },
		2: { color: 'text-gray-300', label: '2nd Place!', emoji: '🥈' },
		3: { color: 'text-amber-600', label: '3rd Place!', emoji: '🥉' },
	}[rank];

	if (!config) return null;

	return (
		<motion.div
			initial={{ scale: 0, rotate: -180 }}
			animate={{ scale: 1, rotate: 0 }}
			transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
			className="flex flex-col items-center"
		>
			<motion.span
				animate={{ scale: [1, 1.1, 1] }}
				transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
				className="mb-4 text-8xl"
			>
				{config.emoji}
			</motion.span>
			<motion.h3
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.5 }}
				className={`text-4xl font-bold ${config.color}`}
			>
				{config.label}
			</motion.h3>
		</motion.div>
	);
}

export function PlayerWaitingScreen({
	phase,
	answerResult,
	finalScore,
	playerId,
	leaderboard = [],
	modifiers = [],
}: PlayerWaitingScreenProps) {
	const [showConfetti, setShowConfetti] = useState(false);

	// Find player's final rank
	const myFinalEntry = leaderboard.find((p) => p.id === playerId);
	const myFinalRank = myFinalEntry?.rank ?? 0;
	const isOnPodium = myFinalRank >= 1 && myFinalRank <= 3;

	// Trigger confetti for podium finishes
	useEffect(() => {
		if (phase === 'END' && isOnPodium) {
			setShowConfetti(true);
			// Stop confetti after animation completes
			const timer = setTimeout(() => setShowConfetti(false), 5000);
			return () => clearTimeout(timer);
		}
	}, [phase, isOnPodium]);

	const renderContent = () => {
		switch (phase) {
			case 'LOBBY':
				return (
					<div className="text-center">
						<h2 className="text-4xl font-bold">You're in!</h2>
						<p>See your name on the big screen.</p>
					</div>
				);
			case 'GET_READY':
				return (
					<div className="flex flex-col items-center text-center">
						<motion.div
							animate={{ scale: [1, 1.1, 1] }}
							transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
							className="mb-4 text-6xl"
						>
							🎮
						</motion.div>
						<h2 className="text-4xl font-bold">Get Ready!</h2>
						<p className="mt-2 text-lg text-slate-300">Look at the main screen</p>
					</div>
				);
			case 'QUESTION_MODIFIER': {
				// Show modifier animation based on the modifiers
				const hasDoublePoints = modifiers.includes('doublePoints');
				if (hasDoublePoints) {
					return <PlayerDoublePointsAnimation />;
				}
				// Fallback for unknown modifiers
				return (
					<div className="flex flex-col items-center text-center">
						<Loader2 className="mb-4 h-12 w-12 animate-spin" />
						<h2 className="text-4xl font-bold">Special Round!</h2>
					</div>
				);
			}
			case 'REVEAL':
				if (answerResult) {
					return (
						<div
							className={`flex flex-col items-center justify-center text-center ${answerResult.isCorrect ? 'text-green-300' : 'text-red-300'}`}
						>
							{answerResult.isCorrect ? <CheckCircle className="h-24 w-24" /> : <XCircle className="h-24 w-24" />}
							<h2 className="mt-4 text-5xl font-bold">{answerResult.isCorrect ? 'Correct!' : 'Incorrect'}</h2>
							<p className="text-3xl">+ {answerResult.score} points</p>
						</div>
					);
				}
				return (
					<div className="text-center">
						<h2 className="text-4xl font-bold">Get ready...</h2>
						<p>Look at the main screen.</p>
					</div>
				);
			case 'LEADERBOARD': {
				const myEntry = leaderboard.find((p) => p.id === playerId);
				const myRank = myEntry?.rank ?? 0;
				const top3 = leaderboard.slice(0, 3);
				return (
					<div className="text-center">
						<h2 className="mb-4 text-4xl font-bold">Current Standings</h2>
						{myRank > 0 && (
							<p className="mb-6 text-2xl">
								You are in <span className="font-bold text-quiz-gold">#{myRank}</span> place!
							</p>
						)}
						<ul className="space-y-2 text-lg">
							{top3.map((player, i) => (
								<li key={player.id} className="mx-auto flex w-64 justify-between">
									<span>
										<Trophy
											className={`mr-2 inline h-5 w-5 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-400' : 'text-yellow-600'}`}
										/>
										{player.name}
									</span>
									<span>{player.score}</span>
								</li>
							))}
						</ul>
					</div>
				);
			}
			case 'END':
				return (
					<div className="text-center">
						{showConfetti && <CelebrationConfetti />}
						<motion.h2 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 text-4xl font-bold">
							Game Over!
						</motion.h2>

						{isOnPodium ? (
							<PodiumRankDisplay rank={myFinalRank} />
						) : myFinalRank > 0 ? (
							<motion.div
								initial={{ opacity: 0, scale: 0.8 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ delay: 0.2 }}
								className="mb-4"
							>
								<span className="mb-2 block text-5xl">⭐</span>
								<span className="text-3xl font-bold text-indigo-300">#{myFinalRank}</span>
								<p className="mt-2 text-xl text-slate-300">Thanks for playing!</p>
							</motion.div>
						) : null}

						<motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-4 text-2xl">
							Final score: <span className="font-bold text-quiz-gold">{finalScore}</span>
						</motion.p>
					</div>
				);
			default:
				return (
					<div className="flex flex-col items-center text-center">
						<Loader2 className="mb-4 h-12 w-12 animate-spin" />
						<h2 className="text-4xl font-bold">Waiting...</h2>
					</div>
				);
		}
	};
	return (
		<motion.div
			key={phase + (answerResult ? 'result' : '')}
			initial={{ opacity: 0, scale: 0.8 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.8 }}
			className="flex h-full w-full items-center justify-center"
		>
			{renderContent()}
		</motion.div>
	);
}
