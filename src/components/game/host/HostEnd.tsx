import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import type { LeaderboardEntry } from '@/hooks/useGameWebSocket';

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
						{entry.players.map((player, idx) => (
							<motion.p
								key={player.name}
								className="text-lg font-bold leading-tight sm:text-2xl"
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: delay + 0.2 + idx * 0.1 }}
							>
								{player.name}
							</motion.p>
						))}
					</div>
					<motion.p
						className="text-sm sm:text-lg"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: delay + 0.3 }}
					>
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
						<motion.span initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: delay + 0.2, type: 'spring' }}>
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
}

export function HostEnd({ leaderboard }: HostEndProps) {
	const podiumEntries = getPodiumEntries(leaderboard);

	// Get entries for each position (may be undefined if not enough players or skipped due to ties)
	const firstPlace = podiumEntries.get(1);
	const secondPlace = podiumEntries.get(2);
	const thirdPlace = podiumEntries.get(3);

	return (
		<div className="flex flex-grow flex-col items-center justify-center gap-4 p-4 sm:gap-6 sm:p-8">
			<motion.h1
				initial={{ opacity: 0, scale: 0.5 }}
				animate={{ opacity: 1, scale: 1 }}
				className="text-3xl font-bold sm:text-5xl md:text-7xl"
			>
				🏆 Final Podium 🏆
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
		</div>
	);
}
