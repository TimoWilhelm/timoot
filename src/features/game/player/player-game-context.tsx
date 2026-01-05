import { createContext, useContext, useMemo } from 'react';

import type { WebSocketGameState } from '@/features/game/hooks/use-game-web-socket';
import type { EmojiReaction } from '@shared/types';

interface PlayerGameContextProperties {
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

const PlayerGameContext = createContext<PlayerGameContextProperties | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export function usePlayerGameContext() {
	const context = useContext(PlayerGameContext);
	if (!context) {
		throw new Error('usePlayerGameContext must be used within a PlayerGameProvider');
	}
	return context;
}

export function PlayerGameProvider({ children, ...properties }: PlayerGameContextProperties & { children: React.ReactNode }) {
	const value = useMemo(() => properties, [properties]);

	return <PlayerGameContext.Provider value={value}>{children}</PlayerGameContext.Provider>;
}
