import { type VariantProps } from 'class-variance-authority';
import { Toggle as TogglePrimitive } from 'radix-ui';
import * as React from 'react';

import { buttonVariants } from '@/components/button/button-variants';
import { cn } from '@/lib/utilities';

export const Toggle = React.forwardRef<
	React.ComponentRef<typeof TogglePrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> & VariantProps<typeof buttonVariants>
>(({ className, variant = 'ghost', size = 'default', asChild = false, ...properties }, reference) => (
	<TogglePrimitive.Root
		ref={reference}
		asChild={asChild}
		className={cn(
			!asChild &&
				buttonVariants({
					variant,
					size,
				}),
			!asChild &&
				`
					data-[state=on]:border-black data-[state=on]:bg-orange
					data-[state=on]:text-black data-[state=on]:shadow-brutal-inset
					data-[state=on]:hover:translate-y-0 data-[state=on]:hover:bg-orange/90
					data-[state=on]:hover:shadow-brutal-inset
					data-[state=on]:active:translate-y-0.5
				`,
			className,
		)}
		{...properties}
	/>
));
Toggle.displayName = TogglePrimitive.Root.displayName;
