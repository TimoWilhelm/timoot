import * as React from 'react';

import { cn } from '@/lib/utilities';

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...properties }, reference) => (
	<div
		ref={reference}
		className={cn(
			`
				rounded-xl border-2 border-black bg-white text-card-foreground shadow-brutal
				transition-all duration-75 ease-out
			`,
			className,
		)}
		{...properties}
	/>
));
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...properties }, reference) => (
		<div ref={reference} className={cn('flex flex-col space-y-1.5 p-6', className)} {...properties} />
	),
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...properties }, reference) => (
		<div ref={reference} className={cn('font-display text-xl leading-none font-bold tracking-tight', className)} {...properties} />
	),
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...properties }, reference) => (
		<div ref={reference} className={cn('text-sm font-medium text-muted-foreground', className)} {...properties} />
	),
);
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...properties }, reference) => <div ref={reference} className={cn('p-6 pt-0', className)} {...properties} />,
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...properties }, reference) => (
		<div ref={reference} className={cn('flex items-center p-6 pt-0', className)} {...properties} />
	),
);
CardFooter.displayName = 'CardFooter';
