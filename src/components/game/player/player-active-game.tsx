import { AnimatePresence, motion } from 'framer-motion';

import { PlayerAnswer } from '@/components/game/player/player-answer';
import { PlayerWaiting } from '@/components/game/player/player-waiting';
import { EmojiPicker } from '@/components/game/shared';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { WebSocketGameState } from '@/hooks/use-game-web-socket';
import { phaseAllowsEmoji } from '@shared/phase-rules';
import { EmojiReaction } from '@shared/types';

interface PlayerActiveGameProperties {
	gameState: WebSocketGameState;
	nickname: string;
	score: number;
	hasInitialScoreSync: boolean;
	submittedAnswer?: number;
	onAnswer: (index: number) => void;
	onSendEmoji: (emoji: EmojiReaction) => void;
	// Optional items that were derived in PlayerPage
	answerResult?: { isCorrect: boolean; score: number };
	playerId?: string;
}

export function PlayerActiveGame({
	gameState,
	nickname,
	score,
	hasInitialScoreSync,
	submittedAnswer,
	onAnswer,
	onSendEmoji,
	answerResult,
	playerId,
}: PlayerActiveGameProperties) {
	return (
		<>
			<header
				className={`
					relative flex items-center justify-center rounded-lg border-2 border-slate
					bg-slate/50 px-4 py-2 text-xl font-bold
				`}
			>
				<div className="flex w-full max-w-2xl justify-between">
					<span className="font-display">{nickname}</span>
					<span className="font-mono">
						Score: <AnimatedNumber value={score} instant={!hasInitialScoreSync} />
					</span>
				</div>
			</header>
			<main className="relative flex grow items-center justify-center">
				<AnimatePresence mode="wait">
					{gameState.phase === 'QUESTION' && gameState.options.length > 0 ? (
						<PlayerAnswer
							onAnswer={onAnswer}
							submittedAnswer={submittedAnswer}
							optionIndices={Array.from({ length: gameState.options.length }, (_, index) => index)}
						/>
					) : (
						<PlayerWaiting
							phase={gameState.phase}
							answerResult={answerResult}
							finalScore={score}
							playerId={playerId}
							leaderboard={gameState.leaderboard}
							modifiers={gameState.modifiers}
						/>
					)}
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
