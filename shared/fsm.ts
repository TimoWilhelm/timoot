/**
 * Generic finite state machine utility.
 * Based on https://dev.to/davidkpiano/you-don-t-need-a-library-for-state-machines-k7h
 */

export type TransitionTable<TState extends string, TEvent extends string> = Record<TState, Partial<Record<TEvent, TState>>>;

export interface Machine<TState extends string, TEvent extends string> {
	/** Get the next state for a given state and event. Returns current state if transition is not defined. */
	transition: (state: TState, event: TEvent) => TState;
	/** Check if a transition is defined for a given state and event. */
	canTransition: (state: TState, event: TEvent) => boolean;
}

/**
 * Create a finite state machine from a transition table.
 *
 * @example
 * const connectionMachine = createMachine({
 *   idle: { CONNECT: 'connecting' },
 *   connecting: { CONNECTED: 'connected', DISCONNECTED: 'disconnected' },
 *   connected: { DISCONNECTED: 'disconnected' },
 *   disconnected: { RECONNECT: 'connecting' },
 * });
 *
 * connectionMachine.transition('idle', 'CONNECT'); // => 'connecting'
 * connectionMachine.canTransition('connected', 'CONNECT'); // => false
 */
export function createMachine<TState extends string, TEvent extends string>(
	transitions: TransitionTable<TState, TEvent>,
): Machine<TState, TEvent> {
	return {
		transition: (state: TState, event: TEvent): TState => transitions[state][event] ?? state,
		canTransition: (state: TState, event: TEvent): boolean => transitions[state][event] !== undefined,
	};
}
