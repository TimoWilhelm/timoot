import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import type { LeaderboardEntry } from '@/hooks/use-game-web-socket';

interface PodiumEntry {
	players: LeaderboardEntry[];
	rank: number;
}

// Group players by score and assign ranks (handles ties)
function getPodiumEntries(leaderboard: LeaderboardEntry[]): Map<number, PodiumEntry> {
	const podiumMap = new Map<number, PodiumEntry>();
	if (leaderboard.length === 0) return podiumMap;

	let currentRank = 1;
	let i = 0;

	while (i < leaderboard.length && currentRank <= 3) {
		const currentScore = leaderboard[i].score;
		const playersWithSameScore: LeaderboardEntry[] = [];

		// Collect all players with the same score
		while (i < leaderboard.length && leaderboard[i].score === currentScore) {
			playersWithSameScore.push(leaderboard[i]);
			i++;
		}

		podiumMap.set(currentRank, { players: playersWithSameScore, rank: currentRank });

		// Skip ranks equal to number of tied players (e.g., if 2 players tie for 1st, next is 3rd)
		currentRank += playersWithSameScore.length;
	}

	return podiumMap;
}

const PODIUM_CONFIG = {
	1: { height: 'h-40 sm:h-52', color: 'bg-yellow-400', emoji: '🥇', delay: 2.0 },
	2: { height: 'h-28 sm:h-40', color: 'bg-gray-400', emoji: '🥈', delay: 1.0 },
	3: { height: 'h-20 sm:h-28', color: 'bg-amber-600', emoji: '🥉', delay: 0 },
} as const;

function PodiumPlace({ entry, position }: { entry: PodiumEntry | undefined; position: 1 | 2 | 3 }) {
	// Use entry's rank for styling if exists, otherwise use the position for placeholder height
	const config = PODIUM_CONFIG[entry?.rank as keyof typeof PODIUM_CONFIG] ?? PODIUM_CONFIG[position];
	const { height, color, emoji, delay } = config;

	// Pre-allocate the space but keep content invisible until revealed
	return (
		<div className="flex w-24 flex-col items-center text-center sm:w-36">
			{entry ? (
				<motion.div
					className="flex w-full flex-col items-center"
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ type: 'spring', stiffness: 80, damping: 12, delay }}
				>
					{/* Player names (handles multiple tied players) */}
					<div className="mb-1 flex flex-col items-center">
						{entry.players.map((player, idx) => {
							const isFirstPlace = entry.rank === 1;
							return (
								<motion.p
									key={player.name}
									className={`font-bold leading-tight ${
										isFirstPlace
											? 'text-2xl text-quiz-orange drop-shadow-[0_0_10px_rgba(244,129,32,0.6)] sm:text-4xl'
											: 'text-lg sm:text-2xl'
									}`}
									initial={isFirstPlace ? { opacity: 0, scale: 0.6, y: 20 } : { opacity: 0, x: -20 }}
									animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
									transition={{ delay: delay + 0.3 + idx * 0.15, type: 'spring', stiffness: isFirstPlace ? 140 : 80, damping: 12 }}
								>
									{player.name}
								</motion.p>
							);
						})}
					</div>
					<motion.p className="text-sm sm:text-lg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 0.3 }}>
						{entry.players[0].score} pts
					</motion.p>
					{/* Podium block */}
					<motion.div
						className={`${height} mt-2 w-full ${color} flex items-center justify-center rounded-t-lg text-3xl font-bold text-white shadow-lg sm:text-4xl`}
						initial={{ scaleY: 0 }}
						animate={{ scaleY: 1 }}
						transition={{ type: 'spring', stiffness: 100, damping: 15, delay: delay - 0.1 }}
						style={{ originY: 1 }}
					>
						<motion.span
							initial={{ opacity: 0, scale: 0 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ delay: delay + 0.2, type: 'spring' }}
						>
							{emoji}
						</motion.span>
					</motion.div>
				</motion.div>
			) : (
				// Empty placeholder to maintain layout
				<div className={`${height} w-full opacity-0`} />
			)}
		</div>
	);
}

interface HostEndProps {
	leaderboard: LeaderboardEntry[];
	revealed: boolean;
}

export function HostEnd({ leaderboard, revealed }: HostEndProps) {
	const podiumEntries = getPodiumEntries(leaderboard);

	// Get entries for each position (may be undefined if not enough players or skipped due to ties)
	const firstPlace = podiumEntries.get(1);
	const secondPlace = podiumEntries.get(2);
	const thirdPlace = podiumEntries.get(3);

	// Fire confetti when revealed
	useEffect(() => {
		if (!revealed || !firstPlace) return;

		// Fire confetti shortly after podium entries have animated in
		let subtleIntervalId: number | undefined;

		const timeout = window.setTimeout(() => {
			const colors = ['#f48120', '#faad3f', '#404041', '#ff6b4a'];
			const count = 220;
			const defaults = { origin: { y: 0.6 }, colors };

			const fire = (particleRatio: number, opts: confetti.Options) => {
				confetti({
					...defaults,
					...opts,
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

			// Subtle continuous confetti while the podium is visible
			subtleIntervalId = window.setInterval(() => {
				confetti({
					particleCount: 2,
					angle: 60,
					spread: 55,
					origin: { x: 0 },
					colors: colors,
				});
				confetti({
					particleCount: 2,
					angle: 120,
					spread: 55,
					origin: { x: 1 },
					colors: colors,
				});
			}, 20);
		}, 800);

		return () => {
			window.clearTimeout(timeout);
			if (subtleIntervalId !== undefined) {
				window.clearInterval(subtleIntervalId);
			}
		};
	}, [revealed, firstPlace]);

	return (
		<div className="flex flex-grow flex-col items-center justify-center gap-4 whitespace-nowrap p-4 sm:gap-6 sm:p-8">
			<AnimatePresence mode="wait">
				{!revealed ? (
					<motion.div
						key="intro"
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 1.05 }}
						transition={{ duration: 0.5, ease: 'easeOut' }}
						className="flex flex-col items-center gap-6"
					>
						<motion.h1
							initial={false}
							animate={{ opacity: [0.6, 1, 0.6] }}
							transition={{ duration: 1.2, repeat: Infinity }}
							className="text-center text-3xl font-bold sm:text-5xl md:text-6xl"
						>
							<span className="mx-2 sm:mx-4">And the winners are...</span>
						</motion.h1>
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.2 }}
							className="flex items-center gap-3 rounded-full bg-quiz-orange/10 px-4 py-2 text-sm font-medium text-quiz-orange sm:text-base"
						>
							<motion.span
								animate={{ rotate: [-10, 10] }}
								transition={{ repeat: Infinity, repeatType: 'mirror', duration: 0.5, ease: 'easeInOut' }}
								className="inline-block text-lg sm:text-xl"
							>
								🏆
							</motion.span>
							<span>Crunching final scores...</span>
						</motion.div>
					</motion.div>
				) : (
					<motion.div
						key="podium"
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, ease: 'easeOut' }}
						className="flex flex-col items-center gap-4 sm:gap-6"
					>
						<motion.h1
							initial={{ opacity: 0, scale: 0.5 }}
							animate={{ opacity: 1, scale: 1 }}
							className="text-3xl font-bold sm:text-5xl md:text-7xl"
						>
							<motion.span
								className="inline-block"
								animate={{ rotate: [-12, 12] }}
								transition={{ repeat: Infinity, repeatType: 'mirror', duration: 0.5, ease: 'easeInOut' }}
							>
								🏆
							</motion.span>
							<span className="mx-2 sm:mx-4">Top Scorers!</span>
							<motion.span
								className="inline-block"
								animate={{ rotate: [-12, 12] }}
								transition={{ repeat: Infinity, repeatType: 'mirror', duration: 0.5, ease: 'easeInOut' }}
							>
								🏆
							</motion.span>
						</motion.h1>

						{/* Podium container with fixed layout: 2nd | 1st | 3rd */}
						<div className="flex items-end justify-center gap-2 sm:gap-4">
							<PodiumPlace entry={secondPlace} position={2} />
							<PodiumPlace entry={firstPlace} position={1} />
							<PodiumPlace entry={thirdPlace} position={3} />
						</div>

						<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3 }}>
							<Button
								onClick={() => (window.location.href = '/')}
								size="lg"
								className="rounded-2xl bg-quiz-orange px-8 py-6 text-xl font-bold text-white sm:px-12 sm:py-8 sm:text-2xl"
							>
								Play Again
							</Button>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
