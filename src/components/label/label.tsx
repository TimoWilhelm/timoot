import { type VariantProps, cva } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utilities';

const labelVariants = cva(`
	text-sm leading-none font-medium
	peer-disabled:cursor-not-allowed peer-disabled:opacity-70
`);

export function Label({
	className,
	ref,
	...properties
}: React.LabelHTMLAttributes<HTMLLabelElement> &
	VariantProps<typeof labelVariants> & {
		ref?: React.Ref<HTMLLabelElement>;
	}) {
	return <label ref={ref} className={cn(labelVariants(), className)} {...properties} />;
}
Label.displayName = 'Label';
