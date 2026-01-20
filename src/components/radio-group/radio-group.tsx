import { Check } from 'lucide-react';
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utilities';

export const RadioGroup = React.forwardRef<
	React.ComponentRef<typeof RadioGroupPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...properties }, reference) => {
	return <RadioGroupPrimitive.Root className={cn('grid gap-2', className)} {...properties} ref={reference} />;
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

export const RadioGroupItem = React.forwardRef<
	React.ComponentRef<typeof RadioGroupPrimitive.Item>,
	React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...properties }, reference) => {
	return (
		<RadioGroupPrimitive.Item
			ref={reference}
			className={cn(
				`
					aspect-square size-4 shrink-0 cursor-pointer rounded-full border
					border-primary shadow-sm ring-0 ring-transparent ring-offset-0
					transition-all duration-300 ease-spring
					focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2
					focus-visible:outline-hidden
					disabled:cursor-not-allowed disabled:opacity-50
					data-[state=checked]:bg-primary
					data-[state=checked]:text-primary-foreground
				`,
				className,
			)}
			{...properties}
		>
			<RadioGroupPrimitive.Indicator className={cn(`flex items-center justify-center text-current`)}>
				<Check className="size-3" />
			</RadioGroupPrimitive.Indicator>
		</RadioGroupPrimitive.Item>
	);
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;
