import { Radio } from '@base-ui/react/radio';
import { RadioGroup as RadioGroupPrimitive } from '@base-ui/react/radio-group';
import { Check } from 'lucide-react';
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
	data-[checked]:bg-primary
	data-[checked]:text-primary-foreground
`;

// ============================================================================
// Types
// ============================================================================

interface RadioGroupProperties extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive> {
	readonly ref?: React.Ref<HTMLDivElement>;
}

interface RadioGroupItemProperties {
	readonly ref?: React.Ref<HTMLButtonElement>;
	readonly value: string;
	readonly id?: string;
	readonly className?: string;
	readonly disabled?: boolean;
	readonly style?: React.CSSProperties & Record<string, string>;
}

// ============================================================================
// Components
// ============================================================================

/** Radio group container. Wraps Base UI RadioGroup primitive. */
export function RadioGroup({ className, ref, ...properties }: RadioGroupProperties) {
	return <RadioGroupPrimitive className={cn('grid gap-2', className)} {...properties} ref={ref} />;
}
RadioGroup.displayName = 'RadioGroup';

/** Individual radio button item. Must be used within RadioGroup. */
export function RadioGroupItem({ className, ref, ...properties }: RadioGroupItemProperties) {
	return (
		<Radio.Root ref={ref} className={cn(RADIO_ITEM_CLASS_NAME, className)} nativeButton render={<button type="button" />} {...properties}>
			<Radio.Indicator className="flex items-center justify-center text-current" keepMounted>
				<Check className="size-3" />
			</Radio.Indicator>
		</Radio.Root>
	);
}
RadioGroupItem.displayName = 'RadioGroupItem';
