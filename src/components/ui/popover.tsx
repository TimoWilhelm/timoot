import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';

import { cn } from '@/lib/utilities';

const Popover = PopoverPrimitive.Root;

const PopoverAnchor = PopoverPrimitive.Anchor;

const PopoverContent = React.forwardRef<
	React.ElementRef<typeof PopoverPrimitive.Content>,
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
					data-[state=closed]:animate-out data-[state=closed]:fade-out-0
					data-[state=closed]:zoom-out-95
					data-[state=open]:animate-in data-[state=open]:fade-in-0
					data-[state=open]:zoom-in-95
				`,
				className,
			)}
			{...properties}
		/>
	</PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverContent, PopoverAnchor };
