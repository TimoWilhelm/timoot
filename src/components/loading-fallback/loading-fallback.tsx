import { Spinner } from '@/components/spinner/spinner';
import { cn } from '@/lib/utilities';

interface LoadingFallbackProperties {
	readonly className?: string;
	readonly size?: 'sm' | 'md' | 'lg';
	readonly message?: string;
}

/**
 * A centered loading fallback component for use in Suspense boundaries or loading states.
 */
export function LoadingFallback({ className, size = 'md', message }: LoadingFallbackProperties) {
	return (
		<div className={cn('flex flex-col items-center justify-center py-20', className)}>
			<Spinner size={size} />
			{message && <p className="mt-4 text-sm text-muted-foreground">{message}</p>}
		</div>
	);
}
