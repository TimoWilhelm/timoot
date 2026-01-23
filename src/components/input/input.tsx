import * as React from 'react';

import { cn } from '@/lib/utilities';

export function Input({ className, type, ref, ...properties }: React.ComponentProps<'input'> & { ref?: React.Ref<HTMLInputElement> }) {
	return (
		<input
			type={type}
			className={cn(
				`
					flex h-10 w-full overflow-hidden rounded-lg border-2 border-black bg-white
					px-4 py-2 text-base font-medium text-ellipsis shadow-brutal-inset ring-0
					ring-transparent ring-offset-0 transition-all duration-300 ease-spring
					file:border-0 file:bg-transparent file:text-sm file:font-bold
					file:text-foreground
					placeholder:text-ellipsis placeholder:text-muted-foreground
					focus:ring-2 focus:ring-black focus:ring-offset-2 focus:outline-hidden
					disabled:cursor-not-allowed disabled:opacity-50
				`,
				className,
			)}
			ref={ref}
			{...properties}
		/>
	);
}
Input.displayName = 'Input';
