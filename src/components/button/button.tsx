import { type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utilities';

import { buttonVariants } from './button-variants';

export interface ButtonProperties extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
	asChild?: boolean;
}

/**
 * Minimal Slot implementation: renders the single child element,
 * merging the parent's props (className, style, ref, etc.) onto it.
 * Replaces the Radix `Slot` primitive for the `asChild` pattern.
 */
function Slot({ children, ...properties }: React.HTMLAttributes<HTMLElement> & { ref?: React.Ref<HTMLElement> }) {
	if (React.isValidElement<Record<string, unknown>>(children)) {
		const childProperties = children.props;
		return React.cloneElement(children, {
			...properties,
			...childProperties,
			className: cn(properties.className, String(childProperties.className ?? '')),
		});
	}
	return <>{children}</>;
}

export function Button({
	className,
	variant,
	size,
	asChild = false,
	ref,
	...properties
}: ButtonProperties & { ref?: React.Ref<HTMLButtonElement> }) {
	const Comp = asChild ? Slot : 'button';
	return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...properties} />;
}
Button.displayName = 'Button';
