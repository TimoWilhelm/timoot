import { useMemo } from 'react';

import { HostGameContext, type HostGameContextProperties } from './host-game-context';

export function HostGameProvider({ children, ...value }: { children: React.ReactNode } & HostGameContextProperties) {
	const contextValue = useMemo(() => value, [value]);

	return <HostGameContext.Provider value={contextValue}>{children}</HostGameContext.Provider>;
}
