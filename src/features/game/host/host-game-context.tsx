import { createContext, useContext, useMemo } from 'react';

import type { WebSocketGameState } from '@/features/game/hooks/use-game-web-socket';
import type { SoundType } from '@/features/game/hooks/use-host-sound';

interface HostGameContextProperties {
	gameState: WebSocketGameState;
	onStartGame: () => void;
	onNextState: () => void;
	onPlaySound: (sound: SoundType) => void;
	onPlayCountdownTick: (timeLeft: number) => void;
}

const HostGameContext = createContext<HostGameContextProperties | undefined>(undefined);

export function HostGameProvider({ children, ...value }: { children: React.ReactNode } & HostGameContextProperties) {
	const contextValue = useMemo(() => value, [value]);

	return <HostGameContext.Provider value={contextValue}>{children}</HostGameContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useHostGameContext() {
	const context = useContext(HostGameContext);
	if (!context) {
		throw new Error('useHostGameContext must be used within a HostGameProvider');
	}
	return context;
}
