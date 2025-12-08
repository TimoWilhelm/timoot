import { useEffect, useRef, useState, useCallback } from 'react';

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
	const onCloseRef = useRef<() => void>();
	onCloseRef.current = () => {
		setInternalOpen(false);
		onOpenChange?.(false);
	};

	// Track whether we've pushed a history entry for this dialog instance
	const historyStateRef = useRef<'none' | 'pushed' | 'popped'>('none');

	const wrappedOnOpenChange = useCallback(
		(open: boolean) => {
			setInternalOpen(open);
			onOpenChange?.(open);
		},
		[onOpenChange],
	);

	// Handle dialog open: push history state
	useEffect(() => {
		if (isOpen && historyStateRef.current === 'none') {
			window.history.pushState({ dialogOpen: true }, '');
			historyStateRef.current = 'pushed';
		}
	}, [isOpen]);

	// Handle dialog close: clean up history if we pushed it
	useEffect(() => {
		if (!isOpen && historyStateRef.current === 'pushed') {
			// Dialog was closed by user action (not back button), remove our history entry
			historyStateRef.current = 'none';
			window.history.back();
		} else if (!isOpen) {
			// Reset state when dialog is closed
			historyStateRef.current = 'none';
		}
	}, [isOpen]);

	// Listen for popstate (back button)
	useEffect(() => {
		const handlePopState = () => {
			if (historyStateRef.current === 'pushed') {
				// Back button was pressed while dialog was open
				historyStateRef.current = 'popped';
				onCloseRef.current?.();
			}
		};

		window.addEventListener('popstate', handlePopState);
		return () => window.removeEventListener('popstate', handlePopState);
	}, []);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (historyStateRef.current === 'pushed') {
				window.history.back();
			}
		};
	}, []);

	return { wrappedOnOpenChange };
}
