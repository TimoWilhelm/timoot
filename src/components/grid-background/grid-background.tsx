import { cn } from '@/lib/utilities';

interface GridBackgroundProperties {
	className?: string;
	variant?: 'default' | 'dark';
}

export function GridBackground({ className, variant = 'default' }: GridBackgroundProperties) {
	return (
		<div
			className={cn(
				`pointer-events-none absolute inset-0 bg-size-[20px_20px]`,
				variant === 'dark'
					? `
						bg-[radial-gradient(var(--color-zinc-light)_1px,transparent_1px)]
						opacity-10
					`
					: `
						bg-[radial-gradient(var(--color-zinc-dark)_1px,transparent_1px)]
						opacity-15
					`,
				className,
			)}
			aria-hidden="true"
		/>
	);
}
