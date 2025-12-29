import * as React from 'react';

import { cn } from '@/lib/utilities';

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...properties }, reference) => (
	<div
		ref={reference}
		className={cn(
			`
				rounded-xl border-2 border-black bg-white text-card-foreground shadow-brutal
				transition-all duration-200
			`,
			className,
		)}
		{...properties}
	/>
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...properties }, reference) => (
	<div ref={reference} className={cn('flex flex-col space-y-1.5 p-6', className)} {...properties} />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...properties }, reference) => (
	<div ref={reference} className={cn('font-display text-xl leading-none font-bold tracking-tight', className)} {...properties} />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...properties }, reference) => (
		<div ref={reference} className={cn('text-sm font-medium text-muted-foreground', className)} {...properties} />
	),
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...properties }, reference) => (
	<div ref={reference} className={cn('p-6 pt-0', className)} {...properties} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...properties }, reference) => (
	<div ref={reference} className={cn('flex items-center p-6 pt-0', className)} {...properties} />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardContent };
