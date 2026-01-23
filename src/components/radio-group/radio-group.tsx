import { Check } from 'lucide-react';
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utilities';

export function RadioGroup({
	className,
	ref,
	...properties
}: React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> & {
	ref?: React.Ref<React.ComponentRef<typeof RadioGroupPrimitive.Root>>;
}) {
	return <RadioGroupPrimitive.Root className={cn('grid gap-2', className)} {...properties} ref={ref} />;
}
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

export function RadioGroupItem({
	className,
	ref,
	...properties
}: React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> & {
	ref?: React.Ref<React.ComponentRef<typeof RadioGroupPrimitive.Item>>;
}) {
	return (
		<RadioGroupPrimitive.Item
			ref={ref}
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
}
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;
