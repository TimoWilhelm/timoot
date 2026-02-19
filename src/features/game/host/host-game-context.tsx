import { createContext, useContext } from 'react';

import type { WebSocketGameState } from '@/features/game/hooks/use-game-web-socket';
import type { SoundType } from '@/features/game/hooks/use-host-sound';

export interface HostGameContextProperties {
	gameState: WebSocketGameState;
	isAdvancing: boolean;
	onStartGame: () => void;
	onNextState: () => void;
	onPlaySound: (sound: SoundType) => void;
	onPlayCountdownTick: (timeLeft: number) => void;
}

export const HostGameContext = createContext<HostGameContextProperties | undefined>(undefined);

export function useHostGameContext() {
	const context = useContext(HostGameContext);
	if (!context) {
		throw new Error('useHostGameContext must be used within a HostGameProvider');
	}
	return context;
}
