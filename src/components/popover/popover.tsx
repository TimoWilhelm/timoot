import { Popover as PopoverPrimitive } from '@base-ui/react/popover';
import * as React from 'react';

import { cn } from '@/lib/utilities';

// ============================================================================
// Constants
// ============================================================================

const POPOVER_CONTENT_CLASS_NAME = `
	z-50 w-72 origin-(--transform-origin) rounded-xl
	border-2 border-black bg-popover p-4 text-popover-foreground shadow-brutal
	outline-none
	data-[side=bottom]:[--tw-enter-translate-y:-0.5rem]
	data-[side=left]:[--tw-enter-translate-x:0.5rem]
	data-[side=right]:[--tw-enter-translate-x:-0.5rem]
	data-[side=top]:[--tw-enter-translate-y:0.5rem]
	data-[closed]:animate-popover-out
	data-[open]:animate-popover-in
	dark:border-black dark:shadow-brutal
`;

// ============================================================================
// Types
// ============================================================================

interface PopoverContentProperties {
	readonly ref?: React.Ref<HTMLDivElement>;
	readonly className?: string;
	readonly children?: React.ReactNode;
	readonly align?: 'start' | 'center' | 'end';
	readonly sideOffset?: number;
	readonly side?: 'top' | 'bottom' | 'left' | 'right';
	readonly onOpenAutoFocus?: (event: Event) => void;
}

// ============================================================================
// Components
// ============================================================================

/** Popover root component. Wraps Base UI Popover primitive. */
export const Popover = PopoverPrimitive.Root;

/** Anchor point for popover positioning. */
export function PopoverAnchor({
	children,
	className,
	asChild: _asChild,
	...properties
}: {
	children?: React.ReactNode;
	className?: string;
	asChild?: boolean;
	ref?: React.Ref<HTMLDivElement>;
}) {
	// Base UI doesn't have a separate Anchor component.
	// We wrap children in a div and let the Positioner's anchor prop handle it if needed.
	// For now, PopoverAnchor renders its children directly.
	return (
		<div className={className} {...properties}>
			{children}
		</div>
	);
}

/** Button that triggers the popover. */
export const PopoverTrigger = PopoverPrimitive.Trigger;

/** Popover content panel. Renders in a portal with animations. */
export function PopoverContent({
	className,
	align = 'center',
	sideOffset = 4,
	side,
	ref,
	onOpenAutoFocus,
	children,
	...properties
}: PopoverContentProperties) {
	return (
		<PopoverPrimitive.Portal>
			<PopoverPrimitive.Positioner sideOffset={sideOffset} align={align} side={side}>
				<PopoverPrimitive.Popup
					ref={ref}
					className={cn(POPOVER_CONTENT_CLASS_NAME, className)}
					initialFocus={onOpenAutoFocus ? false : undefined}
					{...properties}
				>
					{children}
				</PopoverPrimitive.Popup>
			</PopoverPrimitive.Positioner>
		</PopoverPrimitive.Portal>
	);
}
PopoverContent.displayName = 'PopoverContent';
