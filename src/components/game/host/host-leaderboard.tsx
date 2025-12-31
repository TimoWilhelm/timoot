import { ChevronDown, ChevronUp, Crown, Trophy } from 'lucide-react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { LeaderboardEntry } from '@/hooks/use-game-web-socket';
import { cn } from '@/lib/utilities';

interface HostLeaderboardProperties {
	onNext: () => void;
	leaderboard: LeaderboardEntry[];
	isLastQuestion: boolean;
}

export function HostLeaderboard({ onNext, leaderboard, isLastQuestion }: HostLeaderboardProperties) {
	const top5 = leaderboard.slice(0, 5);
	const [animationPhase, setAnimationPhase] = useState<'intro' | 'reorder' | 'done'>('intro');

	// Check if any player has rank changes to animate
	const hasRankChanges = useMemo(() => top5.some((p) => p.previousRank !== undefined && p.previousRank !== p.rank), [top5]);

	// Sort by previous rank for initial display, then switch to current rank
	const sortedPlayers = useMemo(() => {
		if (animationPhase === 'intro' && hasRankChanges) {
			// Sort by previous rank, new entries go to end
			return [...top5].toSorted((a, b) => {
				const aPrevious = a.previousRank ?? 999;
				const bPrevious = b.previousRank ?? 999;
				return aPrevious - bPrevious;
			});
		}
		return top5;
	}, [top5, animationPhase, hasRankChanges]);

	// Phase timing: intro -> reorder -> done
	useEffect(() => {
		// Wait for intro animation to complete (5 items * 150ms delay + 300ms animation)
		const introDelay = setTimeout(() => {
			if (hasRankChanges) {
				setAnimationPhase('reorder');
			} else {
				setAnimationPhase('done');
			}
		}, 1200);

		return () => clearTimeout(introDelay);
	}, [hasRankChanges]);

	// Mark reorder animation as done
	useEffect(() => {
		if (animationPhase === 'reorder') {
			const reorderDelay = setTimeout(() => {
				setAnimationPhase('done');
			}, 800);
			return () => clearTimeout(reorderDelay);
		}
	}, [animationPhase]);

	const getRankChangeIndicator = (player: LeaderboardEntry) => {
		if (player.previousRank === undefined) {
			// New entry to top-5
			return (
				<motion.span
					initial={{ opacity: 0, scale: 0 }}
					animate={{ opacity: 1, scale: 1 }}
					className="ml-2 rounded-full bg-green px-1.5 py-0.5 text-sm text-white"
				>
					NEW
				</motion.span>
			);
		}

		const currentRank = player.rank;
		const diff = player.previousRank - currentRank;
		if (diff > 0) {
			// Moved up
			return (
				<motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`ml-2 flex items-center text-green`}>
					<ChevronUp className="size-5" />
					<span className="text-sm font-medium">{diff}</span>
				</motion.span>
			);
		} else if (diff < 0) {
			// Moved down
			return (
				<motion.span initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`ml-2 flex items-center text-red`}>
					<ChevronDown className="size-5" />
					<span className="text-sm font-medium">{Math.abs(diff)}</span>
				</motion.span>
			);
		}

		return;
	};

	return (
		<div
			className={`
				flex grow flex-col items-center justify-center space-y-8 p-4
				sm:p-8
			`}
		>
			<motion.h1
				initial={{ opacity: 0, y: -30 }}
				animate={{ opacity: 1, y: 0 }}
				className={`
					flex items-center gap-4 font-display text-5xl font-bold
					sm:text-6xl
				`}
			>
				<div
					className={`
						flex size-16 items-center justify-center rounded-full border-4
						border-black bg-yellow shadow-brutal
						sm:size-20
					`}
				>
					<Trophy
						className={`
							size-8 text-black
							sm:size-10
						`}
					/>
				</div>
				Leaderboard
			</motion.h1>
			<Card className="w-full max-w-2xl overflow-hidden">
				<CardContent className="p-0">
					<LayoutGroup>
						<ul className="divide-y-2 divide-black">
							<AnimatePresence mode="popLayout">
								{sortedPlayers.map((player, index) => {
									// Get the visual position for rank display
									const displayRank = player.rank;
									const isMovingUp = player.previousRank !== undefined && player.previousRank > displayRank;
									const isMovingDown = player.previousRank !== undefined && player.previousRank < displayRank;
									const isReordering = animationPhase === 'reorder';

									return (
										<motion.li
											key={player.id}
											layout
											className={`
												flex items-center justify-between bg-white p-4 text-xl font-bold
												sm:text-2xl
											`}
											initial={{ opacity: 0, x: -100 }}
											animate={{
												opacity: 1,
												x: 0,
												scale: isReordering && (isMovingUp || isMovingDown) ? [1, 1.02, 1] : 1,
											}}
											exit={{ opacity: 0, x: 100 }}
											transition={{
												layout: { type: 'spring', stiffness: 300, damping: 30 },
												opacity: { duration: 0.3, delay: index * 0.15 },
												x: { duration: 0.3, delay: index * 0.15 },
												scale: { duration: 0.5 },
											}}
										>
											<span className="flex items-center">
												<span className="w-12 text-center">
													{displayRank <= 3 ? (
														<div
															className={cn(
																`
																	mr-3 flex size-8 items-center justify-center rounded-full
																	border-2 border-black
																`,
																displayRank === 1 ? 'bg-yellow' : displayRank === 2 ? 'bg-muted' : 'bg-orange',
															)}
														>
															<Crown className="size-5" />
														</div>
													) : (
														<span
															className={`
																mr-3 flex size-8 items-center justify-center rounded-full
																border-2 border-black bg-muted text-lg font-bold
															`}
														>
															{displayRank}
														</span>
													)}
												</span>
												{player.name}
												{animationPhase === 'done' && getRankChangeIndicator(player)}
											</span>
											<span
												className={`
													rounded-lg border-2 border-black bg-black px-3 py-1 font-mono
													text-white
												`}
											>
												{player.score}
											</span>
										</motion.li>
									);
								})}
							</AnimatePresence>
						</ul>
					</LayoutGroup>
				</CardContent>
			</Card>
			<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
				<Button
					data-host-next-button
					onClick={onNext}
					variant="accent"
					size="lg"
					className="rounded-xl border-4 px-12 py-8 text-2xl font-black uppercase"
				>
					{isLastQuestion ? 'Final Results' : 'Next Question'}
				</Button>
			</motion.div>
		</div>
	);
}
