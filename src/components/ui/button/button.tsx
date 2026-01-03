import { Slot } from '@radix-ui/react-slot';
import { type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utilities';

import { buttonVariants } from './button-variants';

export interface ButtonProperties extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
	asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProperties>(
	({ className, variant, size, asChild = false, ...properties }, reference) => {
		const Comp = asChild ? Slot : 'button';
		return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={reference} {...properties} />;
	},
);
Button.displayName = 'Button';

export { Button };
