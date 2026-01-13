import { Popover as PopoverPrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utilities';

export const Popover = PopoverPrimitive.Root;

export const PopoverAnchor = PopoverPrimitive.Anchor;

export const PopoverContent = React.forwardRef<
	React.ComponentRef<typeof PopoverPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = 'center', sideOffset = 4, ...properties }, reference) => (
	<PopoverPrimitive.Portal>
		<PopoverPrimitive.Content
			ref={reference}
			align={align}
			sideOffset={sideOffset}
			className={cn(
				`
					z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-md
					border bg-popover p-4 text-popover-foreground shadow-md outline-none
					data-[side=bottom]:[--tw-enter-translate-y:-0.5rem]
					data-[side=left]:[--tw-enter-translate-x:0.5rem]
					data-[side=right]:[--tw-enter-translate-x:-0.5rem]
					data-[side=top]:[--tw-enter-translate-y:0.5rem]
					data-[state=closed]:animate-popover-out
					data-[state=open]:animate-popover-in
				`,
				className,
			)}
			{...properties}
		/>
	</PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;
