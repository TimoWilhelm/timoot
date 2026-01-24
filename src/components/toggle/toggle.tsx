import { type VariantProps } from 'class-variance-authority';
import { Toggle as TogglePrimitive } from 'radix-ui';
import * as React from 'react';

import { buttonVariants } from '@/components/button/button-variants';
import { cn } from '@/lib/utilities';

// ============================================================================
// Constants
// ============================================================================

const TOGGLE_ON_CLASS_NAME = `
	data-[state=on]:border-black data-[state=on]:bg-orange
	data-[state=on]:text-black data-[state=on]:shadow-brutal-inset
	data-[state=on]:hover:translate-y-0 data-[state=on]:hover:bg-orange/90
	data-[state=on]:hover:shadow-brutal-inset
	data-[state=on]:active:translate-y-0.5
`;

// ============================================================================
// Types
// ============================================================================

interface ToggleProperties extends React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root>, VariantProps<typeof buttonVariants> {
	readonly ref?: React.Ref<React.ComponentRef<typeof TogglePrimitive.Root>>;
}

// ============================================================================
// Component
// ============================================================================

/** Toggle button with pressed/unpressed states. Wraps Radix Toggle primitive. */
export function Toggle({ className, variant = 'ghost', size = 'default', asChild = false, ref, ...properties }: ToggleProperties) {
	return (
		<TogglePrimitive.Root
			ref={ref}
			asChild={asChild}
			className={cn(!asChild && buttonVariants({ variant, size }), !asChild && TOGGLE_ON_CLASS_NAME, className)}
			{...properties}
		/>
	);
}
Toggle.displayName = TogglePrimitive.Root.displayName;
