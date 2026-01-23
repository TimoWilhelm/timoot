import * as React from 'react';

import { cn } from '@/lib/utilities';

export function Card({ className, ref, ...properties }: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
	return (
		<div
			ref={ref}
			className={cn(
				`
					rounded-xl border-2 border-black bg-white text-card-foreground
					shadow-brutal transition-all duration-75 ease-out
				`,
				className,
			)}
			{...properties}
		/>
	);
}
Card.displayName = 'Card';

export function CardHeader({ className, ref, ...properties }: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
	return <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...properties} />;
}
CardHeader.displayName = 'CardHeader';

export function CardTitle({ className, ref, ...properties }: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
	return <div ref={ref} className={cn('font-display text-xl leading-none font-bold tracking-tight', className)} {...properties} />;
}
CardTitle.displayName = 'CardTitle';

export function CardDescription({
	className,
	ref,
	...properties
}: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
	return <div ref={ref} className={cn('text-sm font-medium text-muted-foreground', className)} {...properties} />;
}
CardDescription.displayName = 'CardDescription';

export function CardContent({ className, ref, ...properties }: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
	return <div ref={ref} className={cn('p-6 pt-0', className)} {...properties} />;
}
CardContent.displayName = 'CardContent';

export function CardFooter({ className, ref, ...properties }: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
	return <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...properties} />;
}
CardFooter.displayName = 'CardFooter';
