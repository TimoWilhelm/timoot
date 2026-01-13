import * as React from 'react';

import { cn } from '@/lib/utilities';

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(({ className, type, ...properties }, reference) => {
	return (
		<input
			type={type}
			className={cn(
				`
					flex h-10 w-full rounded-lg border-2 border-black bg-white px-4 py-2
					text-base font-medium shadow-brutal-inset transition-all duration-75
					ease-out
					file:border-0 file:bg-transparent file:text-sm file:font-bold
					file:text-foreground
					placeholder:text-muted-foreground
					focus:ring-2 focus:ring-black focus:ring-offset-2 focus:outline-hidden
					disabled:cursor-not-allowed disabled:opacity-50
				`,
				className,
			)}
			ref={reference}
			{...properties}
		/>
	);
});
Input.displayName = 'Input';
