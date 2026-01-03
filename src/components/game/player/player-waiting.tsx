import { CheckCircle, Gamepad2, Home, Loader2, Star, Trophy, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { GamePhase, QuestionModifier } from '@shared/types';
import { cn, getThemeColor } from '@/lib/utilities';
import { Button } from '@/components/ui/button';

interface LeaderboardEntry {
	id: string;
	name: string;
	score: number;
	rank: number;
}

interface PlayerWaitingProperties {
	phase: GamePhase;
	answerResult: { isCorrect: boolean; score: number } | undefined;
	finalScore?: number;
	playerId: string | undefined;
	leaderboard?: LeaderboardEntry[];
	modifiers?: QuestionModifier[];
}

// Double Points animation for player screen
function PlayerDoublePointsAnimation() {
	return (
		<motion.div
			className={`flex size-full flex-col items-center justify-center select-none`}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.3 }}
		>
			{/* Pulse rings */}
			{Array.from({ length: 3 }).map((_, index) => (
				<motion.div
					key={index}
					className="absolute rounded-full border-2 border-slate"
					initial={{ width: 50, height: 50, opacity: 0.8 }}
					animate={{
						width: [50, 300],
						height: [50, 300],
						opacity: [0.8, 0],
					}}
					transition={{
						duration: 1.2,
						delay: index * 0.25,
						repeat: Infinity,
						ease: 'easeOut',
					}}
				/>
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
					className="text-8xl leading-none font-black text-white drop-shadow-xl"
					animate={{ scale: [1, 1.1, 1] }}
					transition={{ duration: 0.5, repeat: Infinity }}
				>
					2×
				</motion.div>
				<motion.div
					className="mt-2 text-xl font-bold tracking-wider text-white/90 uppercase"
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

// Podium rank display component
function PodiumRankDisplay({ rank }: { rank: number }) {
	const config = {
		1: { bgColor: 'bg-yellow', textColor: 'text-black', label: '1st Place!', rankText: '1st' },
		2: { bgColor: 'bg-muted', textColor: 'text-black', label: '2nd Place!', rankText: '2nd' },
		3: { bgColor: 'bg-orange', textColor: 'text-white', label: '3rd Place!', rankText: '3rd' },
	}[rank];

	if (!config) return;

	return (
		<motion.div
			initial={{ scale: 0, rotate: -180 }}
			animate={{ scale: 1, rotate: 0 }}
			transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
			className="flex flex-col items-center"
		>
			<motion.div
				animate={{ scale: [1, 1.1, 1] }}
				transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
				className={cn(
					`
						mb-4 flex size-24 items-center justify-center rounded-xl border-4
						border-slate text-4xl font-black shadow-brutal-slate
					`,
					config.bgColor,
					config.textColor,
				)}
			>
				{config.rankText}
			</motion.div>
			<motion.h3
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.5 }}
				className="font-display text-4xl font-black text-white uppercase"
			>
				{config.label}
			</motion.h3>
		</motion.div>
	);
}

export function PlayerWaiting({ phase, answerResult, finalScore, playerId, leaderboard = [], modifiers = [] }: PlayerWaitingProperties) {
	// Find player's final rank
	const myFinalEntry = leaderboard.find((p) => p.id === playerId);
	const myFinalRank = myFinalEntry?.rank ?? 0;
	const isOnPodium = myFinalRank >= 1 && myFinalRank <= 3;

	// Trigger confetti for podium finishes when revealed
	useEffect(() => {
		if (phase === 'END_REVEALED' && isOnPodium) {
			const colors = [
				getThemeColor('--color-orange'),
				getThemeColor('--color-gold'),
				getThemeColor('--color-slate'),
				getThemeColor('--color-coral'),
			];
			const count = 200;
			const defaults = { origin: { y: 0.6 }, colors };

			const fire = (particleRatio: number, options: confetti.Options) => {
				void confetti({
					...defaults,
					...options,
					particleCount: Math.floor(count * particleRatio),
				});
			};

			fire(0.25, {
				spread: 26,
				startVelocity: 55,
			});
			fire(0.2, {
				spread: 60,
			});
			fire(0.35, {
				spread: 100,
				decay: 0.91,
				scalar: 0.8,
			});
			fire(0.1, {
				spread: 120,
				startVelocity: 25,
				decay: 0.92,
				scalar: 1.2,
			});
			fire(0.1, {
				spread: 120,
				startVelocity: 45,
			});
		}
	}, [phase, isOnPodium]);

	const renderContent = () => {
		switch (phase) {
			case 'LOBBY': {
				return (
					<div className="text-center">
						<h2 className="font-display text-4xl font-bold text-white">You're in!</h2>
						<p className="mt-2 font-medium text-muted-foreground">See your name on the big screen.</p>
					</div>
				);
			}
			case 'GET_READY': {
				return (
					<div className="flex flex-col items-center text-center">
						<motion.div
							animate={{ scale: [1, 1.1, 1] }}
							transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
							className={`
								mb-4 flex size-20 items-center justify-center rounded-xl border-4
								border-orange-dark bg-orange shadow-brutal-slate
							`}
						>
							<Gamepad2 className="size-10 text-white" strokeWidth={2.5} />
						</motion.div>
						<h2 className="font-display text-4xl font-black text-white uppercase">Get Ready!</h2>
						<p className="mt-2 text-lg font-medium text-muted-foreground">Look at the main screen</p>
					</div>
				);
			}
			case 'QUESTION_MODIFIER': {
				// Show modifier animation based on the modifiers
				const hasDoublePoints = modifiers.includes('doublePoints');
				if (hasDoublePoints) {
					return <PlayerDoublePointsAnimation />;
				}
				// Fallback for unknown modifiers
				return (
					<div className="flex flex-col items-center text-center">
						<Loader2 className="mb-4 size-12 animate-spin" />
						<h2 className="text-4xl font-bold">Special Round!</h2>
					</div>
				);
			}
			case 'REVEAL': {
				if (answerResult) {
					return (
						<div
							className={cn('flex flex-col items-center justify-center text-center', answerResult.isCorrect ? 'text-green' : 'text-red')}
						>
							<div
								className={cn(
									'flex size-28 items-center justify-center rounded-full border-4',
									answerResult.isCorrect ? 'border-green bg-green/20' : 'border-red bg-red/20',
								)}
							>
								{answerResult.isCorrect ? <CheckCircle className="size-16" /> : <XCircle className="size-16" />}
							</div>
							<h2 className="mt-4 font-display text-5xl font-bold">{answerResult.isCorrect ? 'Correct!' : 'Incorrect'}</h2>
							<p className="mt-2 text-3xl font-bold">+ {answerResult.score} points</p>
						</div>
					);
				}
				return (
					<div className="text-center">
						<h2 className="font-display text-4xl font-bold text-white">Get ready...</h2>
						<p className="mt-2 font-medium text-muted-foreground">Look at the main screen</p>
					</div>
				);
			}
			case 'LEADERBOARD': {
				const myEntry = leaderboard.find((p) => p.id === playerId);
				const myRank = myEntry?.rank ?? 0;
				const top3 = leaderboard.slice(0, 3);
				return (
					<div className="text-center">
						<h2 className="mb-4 font-display text-4xl font-bold text-white">Current Standings</h2>
						{myRank > 0 && (
							<p className="mb-6 text-2xl font-medium text-muted-foreground">
								You are in <span className="font-bold text-gold">#{myRank}</span> place!
							</p>
						)}
						<ul className="space-y-3 text-lg">
							{top3.map((player, index) => (
								<li
									key={player.id}
									className={`
										mx-auto flex w-64 items-center justify-between rounded-lg border-2
										border-slate bg-slate/50 px-4 py-2
									`}
								>
									<span className="flex items-center font-bold text-white">
										<Trophy
											className={cn(
												'mr-2 inline size-5',
												index === 0 ? 'text-yellow' : index === 1 ? 'text-muted-foreground' : 'text-yellow',
											)}
										/>
										{player.name}
									</span>
									<span className="font-mono font-bold text-gold">{player.score}</span>
								</li>
							))}
						</ul>
					</div>
				);
			}
			case 'END_INTRO': {
				return (
					<div className="text-center">
						<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`flex flex-col items-center gap-4`}>
							<motion.div
								animate={{ scale: [1, 1.1, 1] }}
								transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
								className={`
									flex size-20 items-center justify-center rounded-xl border-4
									border-yellow-dark bg-yellow shadow-brutal-slate
								`}
							>
								<Trophy className="size-10 text-black" strokeWidth={2.5} />
							</motion.div>
							<p className="text-xl text-muted-foreground">Look at the main screen</p>
						</motion.div>
					</div>
				);
			}
			case 'END_REVEALED': {
				return (
					<div className="text-center">
						{isOnPodium ? (
							<PodiumRankDisplay rank={myFinalRank} />
						) : myFinalRank > 0 ? (
							<motion.div
								initial={{ opacity: 0, scale: 0.8 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ delay: 0.2 }}
								className="mb-4 flex flex-col items-center"
							>
								<div
									className={`
										mb-4 flex size-16 items-center justify-center rounded-xl border-4
										border-purple-dark bg-purple shadow-brutal-slate
									`}
								>
									<Star className="size-8 fill-white text-white" />
								</div>
								<span className="font-display text-3xl font-black text-white">#{myFinalRank}</span>
								<p className="mt-2 text-xl font-medium text-muted-foreground">Thanks for playing!</p>
							</motion.div>
						) : undefined}

						<motion.p
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.8 }}
							className="mt-4 text-2xl font-medium text-white"
						>
							Final score: <span className="font-bold text-gold">{finalScore}</span>
						</motion.p>

						<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
							<Button variant="dark-subtle" asChild className="mt-6">
								<Link to="/" viewTransition>
									<Home className="size-4" />
									Back to Home
								</Link>
							</Button>
						</motion.div>
					</div>
				);
			}
			default: {
				return (
					<div className="flex flex-col items-center text-center">
						<Loader2 className="mb-4 size-12 animate-spin text-orange" />
						<h2 className="font-display text-4xl font-bold text-white">Waiting...</h2>
					</div>
				);
			}
		}
	};
	return (
		<>
			<motion.div
				key={phase + (answerResult ? 'result' : '')}
				initial={{ opacity: 0, scale: 0.8 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.8 }}
				className="flex size-full items-center justify-center"
			>
				{renderContent()}
			</motion.div>
		</>
	);
}
