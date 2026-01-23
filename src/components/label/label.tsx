import { type VariantProps, cva } from 'class-variance-authority';
import { Label as LabelPrimitive } from 'radix-ui';
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
}: React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
	VariantProps<typeof labelVariants> & {
		ref?: React.Ref<React.ComponentRef<typeof LabelPrimitive.Root>>;
	}) {
	return <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...properties} />;
}
Label.displayName = LabelPrimitive.Root.displayName;
