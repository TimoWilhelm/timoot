import { cn } from '@/lib/utilities';

interface GridBackgroundProperties {
	className?: string;
	variant?: 'default' | 'dark';
}

export function GridBackground({ className, variant = 'default' }: GridBackgroundProperties) {
	return (
		<div
			className={cn(
				`
					pointer-events-none absolute inset-0
					bg-[radial-gradient(var(--color-slate)_1px,transparent_1px)]
					bg-size-[20px_20px]
				`,
				variant === 'dark' ? 'opacity-50' : 'opacity-30',
				className,
			)}
			aria-hidden="true"
		/>
	);
}
