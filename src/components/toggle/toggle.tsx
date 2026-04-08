import { Toggle as TogglePrimitive } from '@base-ui/react/toggle';
import { type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { buttonVariants } from '@/components/button/button-variants';
import { cn } from '@/lib/utilities';

// ============================================================================
// Constants
// ============================================================================

const TOGGLE_ON_CLASS_NAME = `
	data-[pressed]:border-black data-[pressed]:bg-orange
	data-[pressed]:text-black data-[pressed]:shadow-brutal-inset
	data-[pressed]:hover:translate-y-0 data-[pressed]:hover:bg-orange/90
	data-[pressed]:hover:shadow-brutal-inset
	data-[pressed]:active:translate-y-0.5
`;

// ============================================================================
// Types
// ============================================================================

interface ToggleProperties extends VariantProps<typeof buttonVariants> {
	readonly ref?: React.Ref<HTMLButtonElement>;
	readonly pressed?: boolean;
	readonly defaultPressed?: boolean;
	readonly onPressedChange?: (pressed: boolean) => void;
	readonly disabled?: boolean;
	readonly className?: string;
	readonly children?: React.ReactNode;
	readonly asChild?: boolean;
	readonly 'aria-label'?: string;
	readonly 'aria-pressed'?: boolean;
}

// ============================================================================
// Component
// ============================================================================

/** Toggle button with pressed/unpressed states. Wraps Base UI Toggle primitive. */
export function Toggle({
	className,
	variant = 'ghost',
	size = 'default',
	asChild = false,
	ref,
	children,
	...properties
}: ToggleProperties) {
	if (asChild && React.isValidElement<Record<string, unknown>>(children)) {
		return <TogglePrimitive ref={ref} render={children} className={cn(TOGGLE_ON_CLASS_NAME, className)} {...properties} />;
	}

	return (
		<TogglePrimitive ref={ref} className={cn(buttonVariants({ variant, size }), TOGGLE_ON_CLASS_NAME, className)} {...properties}>
			{children}
		</TogglePrimitive>
	);
}
Toggle.displayName = 'Toggle';
