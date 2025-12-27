import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Hook that handles browser back button for dialogs.
 * When a dialog is open and the user presses back, it closes the dialog
 * instead of navigating to the previous page.
 *
 * @param controlledOpen - The controlled open state (undefined for uncontrolled dialogs)
 * @param onOpenChange - Callback to change the open state
 * @returns Object with wrappedOnOpenChange for the dialog primitive
 */
export function useDialogBackHandler(controlledOpen: boolean | undefined, onOpenChange: ((open: boolean) => void) | undefined) {
	// Track internal state for uncontrolled dialogs
	const [internalOpen, setInternalOpen] = useState(false);
	const isOpen = controlledOpen ?? internalOpen;

	// Use a ref to store the close callback to avoid stale closures in popstate handler
	const onCloseReference = useRef<() => void>();

	useEffect(() => {
		onCloseReference.current = () => {
			setInternalOpen(false);
			onOpenChange?.(false);
		};
	}, [onOpenChange]);

	// Track whether we've pushed a history entry for this dialog instance
	const historyStateReference = useRef<'none' | 'pushed' | 'popped'>('none');

	const wrappedOnOpenChange = useCallback(
		(open: boolean) => {
			setInternalOpen(open);
			onOpenChange?.(open);
		},
		[onOpenChange],
	);

	// Handle dialog open: push history state
	useEffect(() => {
		if (isOpen && historyStateReference.current === 'none') {
			globalThis.history.pushState({ dialogOpen: true }, '');
			historyStateReference.current = 'pushed';
		}
	}, [isOpen]);

	// Handle dialog close: clean up history if we pushed it
	useEffect(() => {
		if (!isOpen && historyStateReference.current === 'pushed') {
			// Dialog was closed by user action (not back button), remove our history entry
			historyStateReference.current = 'none';
			globalThis.history.back();
		} else if (!isOpen) {
			// Reset state when dialog is closed
			historyStateReference.current = 'none';
		}
	}, [isOpen]);

	// Listen for popstate (back button)
	useEffect(() => {
		const handlePopState = () => {
			if (historyStateReference.current === 'pushed') {
				// Back button was pressed while dialog was open
				historyStateReference.current = 'popped';
				onCloseReference.current?.();
			}
		};

		globalThis.addEventListener('popstate', handlePopState);
		return () => globalThis.removeEventListener('popstate', handlePopState);
	}, []);

	// Note: We intentionally do NOT clean up history on unmount.
	// If we called history.back() during unmount, it would interfere with
	// programmatic navigation (e.g., navigate('/host/...') after starting a game).
	// Orphaned history entries are harmless.

	return { wrappedOnOpenChange };
}
