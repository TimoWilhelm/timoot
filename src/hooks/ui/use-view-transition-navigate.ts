import { useCallback } from 'react';
import { useNavigate, type NavigateOptions, type To } from 'react-router-dom';

/**
 * A wrapper around useNavigate that enables view transitions by default.
 * Uses the View Transition API for smooth page transitions.
 */
export function useViewTransitionNavigate() {
	const navigate = useNavigate();

	const viewTransitionNavigate = useCallback(
		(to: To, options?: NavigateOptions) => {
			void navigate(to, { viewTransition: true, ...options });
		},
		[navigate],
	);

	return viewTransitionNavigate;
}
