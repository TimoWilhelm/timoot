import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { Check } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utilities';

const RadioGroup = React.forwardRef<
	React.ElementRef<typeof RadioGroupPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...properties }, reference) => {
	return <RadioGroupPrimitive.Root className={cn('grid gap-2', className)} {...properties} ref={reference} />;
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const RadioGroupItem = React.forwardRef<
	React.ElementRef<typeof RadioGroupPrimitive.Item>,
	React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...properties }, reference) => {
	return (
		<RadioGroupPrimitive.Item
			ref={reference}
			className={cn(
				`
					aspect-square size-4 shrink-0 cursor-pointer rounded-full border
					border-primary shadow-sm
					focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-hidden
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

export { RadioGroup, RadioGroupItem };
