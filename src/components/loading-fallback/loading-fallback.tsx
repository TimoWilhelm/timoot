import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utilities';

interface LoadingFallbackProperties {
	className?: string;
	size?: 'sm' | 'md' | 'lg';
	message?: string;
}

export function LoadingFallback({ className, size = 'md', message }: LoadingFallbackProperties) {
	const sizeClasses = { sm: 'size-8', md: 'size-16', lg: 'size-24' };

	return (
		<div className={cn('flex flex-col items-center justify-center py-20', className)}>
			<Loader2 className={cn(sizeClasses[size], 'animate-spin text-black')} strokeWidth={3} />
			{message && <p className="mt-4 text-sm text-muted-foreground">{message}</p>}
		</div>
	);
}
