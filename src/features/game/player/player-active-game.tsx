import { AnimatePresence, motion } from 'motion/react';

import { AnimatedNumber } from '@/components/animated-number';
import { EmojiPicker } from '@/features/game/player/components/emoji-picker';
import { PlayerAnswer } from '@/features/game/player/player-answer';
import { usePlayerGameContext } from '@/features/game/player/player-game-context';
import { PlayerWaiting } from '@/features/game/player/player-waiting';
import { phaseAllowsEmoji } from '@shared/phase-rules';

export function PlayerActiveGame() {
	const { gameState, nickname, score, hasInitialScoreSync, onSendEmoji } = usePlayerGameContext();
	return (
		<>
			<header
				className={`
					relative flex items-center justify-center rounded-lg border-2 border-slate
					bg-slate/50 px-4 py-2 text-xl font-bold
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
				<AnimatePresence mode="wait">
					{gameState.phase === 'QUESTION' && gameState.options.length > 0 ? <PlayerAnswer /> : <PlayerWaiting />}
				</AnimatePresence>
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
