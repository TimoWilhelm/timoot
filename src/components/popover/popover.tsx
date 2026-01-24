import { Popover as PopoverPrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utilities';

// ============================================================================
// Constants
// ============================================================================

const POPOVER_CONTENT_CLASS_NAME = `
	z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-xl
	border-2 border-black bg-popover p-4 text-popover-foreground shadow-brutal
	outline-none
	data-[side=bottom]:[--tw-enter-translate-y:-0.5rem]
	data-[side=left]:[--tw-enter-translate-x:0.5rem]
	data-[side=right]:[--tw-enter-translate-x:-0.5rem]
	data-[side=top]:[--tw-enter-translate-y:0.5rem]
	data-[state=closed]:animate-popover-out
	data-[state=open]:animate-popover-in
	dark:border-slate dark:shadow-brutal-slate
`;

// ============================================================================
// Types
// ============================================================================

interface PopoverContentProperties extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> {
	readonly ref?: React.Ref<React.ComponentRef<typeof PopoverPrimitive.Content>>;
}

// ============================================================================
// Components
// ============================================================================

/** Popover root component. Wraps Radix Popover primitive. */
export const Popover = PopoverPrimitive.Root;

/** Anchor point for popover positioning. */
export const PopoverAnchor = PopoverPrimitive.Anchor;

/** Button that triggers the popover. */
export const PopoverTrigger = PopoverPrimitive.Trigger;

/** Popover content panel. Renders in a portal with animations. */
export function PopoverContent({ className, align = 'center', sideOffset = 4, ref, ...properties }: PopoverContentProperties) {
	return (
		<PopoverPrimitive.Portal>
			<PopoverPrimitive.Content
				ref={ref}
				align={align}
				sideOffset={sideOffset}
				className={cn(POPOVER_CONTENT_CLASS_NAME, className)}
				{...properties}
			/>
		</PopoverPrimitive.Portal>
	);
}
PopoverContent.displayName = PopoverPrimitive.Content.displayName;
