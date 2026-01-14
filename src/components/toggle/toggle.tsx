import { type VariantProps } from 'class-variance-authority';
import { Toggle as TogglePrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utilities';

import { buttonVariants } from '../button/button-variants';

type ToggleVariantProperties = Omit<VariantProps<typeof buttonVariants>, 'variant'> & {
	/**
	 * Variant when toggled off
	 * @default 'subtle'
	 */
	offVariant?: VariantProps<typeof buttonVariants>['variant'];
};

export interface ToggleProperties extends React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root>, ToggleVariantProperties {}

export const Toggle = React.forwardRef<React.ComponentRef<typeof TogglePrimitive.Root>, ToggleProperties>(
	({ className, size, offVariant = 'subtle', ...properties }, reference) => (
		<TogglePrimitive.Root
			ref={reference}
			className={cn(
				buttonVariants({ variant: offVariant, size }),
				// Override styles when pressed (data-state="on")
				`
					data-[state=on]:bg-orange data-[state=on]:text-primary
					data-[state=on]:shadow-brutal-sm
				`,
				'data-[state=on]:hover:bg-orange/90',
				className,
			)}
			{...properties}
		/>
	),
);
Toggle.displayName = 'Toggle';
