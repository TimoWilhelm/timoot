import { useMemo } from 'react';

import { PlayerGameContext, type PlayerGameContextProperties } from './player-game-context';

export function PlayerGameProvider({ children, ...properties }: PlayerGameContextProperties & { children: React.ReactNode }) {
	const value = useMemo(() => properties, [properties]);

	return <PlayerGameContext.Provider value={value}>{children}</PlayerGameContext.Provider>;
}
