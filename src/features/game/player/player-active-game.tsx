import { AnimatePresence, motion } from 'motion/react';

import { AnimatedNumber } from '@/components/animated-number';
import { Spinner } from '@/components/spinner/spinner';
import { EmojiPicker } from '@/features/game/player/components/emoji-picker';
import { PlayerAnswer } from '@/features/game/player/player-answer';
import { usePlayerGameContext } from '@/features/game/player/player-game-context';
import { PlayerWaiting } from '@/features/game/player/player-waiting';
import { useReadingCountdown } from '@/features/game/shared/use-reading-countdown';
import { phaseAllowsEmoji } from '@shared/phase-rules';

export function PlayerActiveGame() {
	const { gameState, nickname, score, hasInitialScoreSync, onSendEmoji } = usePlayerGameContext();
	const { isReading } = useReadingCountdown(gameState.startTime, gameState.readingDurationMs);

	const isQuestionPhase = gameState.phase === 'QUESTION';

	const renderMain = () => {
		if (isQuestionPhase && (isReading || gameState.options.length === 0)) {
			return (
				<motion.div
					key="reading"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.15 }}
					className="flex size-full flex-col items-center justify-center gap-4"
				>
					<Spinner size="lg" />
					<p className="text-lg font-medium text-muted-foreground">Look at the main screen</p>
				</motion.div>
			);
		}
		if (isQuestionPhase) {
			return <PlayerAnswer />;
		}
		return <PlayerWaiting />;
	};

	return (
		<>
			<header
				className={`
					relative flex items-center justify-center rounded-lg border-2 border-black
					bg-zinc px-4 py-2 text-xl font-bold
				`}
			>
				<div className="flex w-full max-w-2xl items-center justify-between gap-4">
					<span className="min-w-0 truncate font-display">{nickname}</span>
					<span className="shrink-0 font-mono whitespace-nowrap">
						Score: <AnimatedNumber value={score} instant={!hasInitialScoreSync} />
					</span>
				</div>
			</header>
			<main className="relative flex grow items-center justify-center">
				<AnimatePresence mode="wait">{renderMain()}</AnimatePresence>
			</main>
			<AnimatePresence>
				{phaseAllowsEmoji[gameState.phase] && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.15 }}
						className="fixed inset-x-0 bottom-0 z-30 pb-4"
					>
						<EmojiPicker onEmojiSelect={onSendEmoji} />
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
}
