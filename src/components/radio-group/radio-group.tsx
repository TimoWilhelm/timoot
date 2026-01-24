import { Check } from 'lucide-react';
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utilities';

// ============================================================================
// Constants
// ============================================================================

const RADIO_ITEM_CLASS_NAME = `
	aspect-square size-4 shrink-0 cursor-pointer rounded-full border
	border-primary shadow-sm ring-0 ring-transparent ring-offset-0
	transition-all duration-300 ease-spring
	focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2
	focus-visible:outline-hidden
	disabled:cursor-not-allowed disabled:opacity-50
	data-[state=checked]:bg-primary
	data-[state=checked]:text-primary-foreground
`;

// ============================================================================
// Types
// ============================================================================

interface RadioGroupProperties extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> {
	readonly ref?: React.Ref<React.ComponentRef<typeof RadioGroupPrimitive.Root>>;
}

interface RadioGroupItemProperties extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {
	readonly ref?: React.Ref<React.ComponentRef<typeof RadioGroupPrimitive.Item>>;
}

// ============================================================================
// Components
// ============================================================================

/** Radio group container. Wraps Radix RadioGroup primitive. */
export function RadioGroup({ className, ref, ...properties }: RadioGroupProperties) {
	return <RadioGroupPrimitive.Root className={cn('grid gap-2', className)} {...properties} ref={ref} />;
}
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

/** Individual radio button item. Must be used within RadioGroup. */
export function RadioGroupItem({ className, ref, ...properties }: RadioGroupItemProperties) {
	return (
		<RadioGroupPrimitive.Item ref={ref} className={cn(RADIO_ITEM_CLASS_NAME, className)} {...properties}>
			<RadioGroupPrimitive.Indicator className="flex items-center justify-center text-current">
				<Check className="size-3" />
			</RadioGroupPrimitive.Indicator>
		</RadioGroupPrimitive.Item>
	);
}
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;
