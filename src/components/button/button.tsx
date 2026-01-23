import { type VariantProps } from 'class-variance-authority';
import { Slot as SlotPrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utilities';

import { buttonVariants } from './button-variants';

export interface ButtonProperties extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
	asChild?: boolean;
}

export function Button({
	className,
	variant,
	size,
	asChild = false,
	ref,
	...properties
}: ButtonProperties & { ref?: React.Ref<HTMLButtonElement> }) {
	const Comp = asChild ? SlotPrimitive.Root : 'button';
	return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...properties} />;
}
Button.displayName = 'Button';
