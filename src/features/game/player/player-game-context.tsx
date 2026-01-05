import { createContext, useContext } from 'react';

import type { WebSocketGameState } from '@/features/game/hooks/use-game-web-socket';
import type { EmojiReaction } from '@shared/types';

export interface PlayerGameContextProperties {
	gameState: WebSocketGameState;
	nickname: string;
	score: number;
	hasInitialScoreSync: boolean;
	submittedAnswer?: number;
	onAnswer: (index: number) => void;
	onSendEmoji: (emoji: EmojiReaction) => void;
	answerResult?: { isCorrect: boolean; score: number };
	playerId?: string;
}

export const PlayerGameContext = createContext<PlayerGameContextProperties | undefined>(undefined);

export function usePlayerGameContext() {
	const context = useContext(PlayerGameContext);
	if (!context) {
		throw new Error('usePlayerGameContext must be used within a PlayerGameProvider');
	}
	return context;
}
