import { cn } from '@/lib/utilities';

const variants = {
	dark: 'bg-[radial-gradient(var(--color-grid-slate)_1px,transparent_1px)] opacity-30',
	light: 'bg-[radial-gradient(var(--color-slate)_1px,transparent_1px)] opacity-50',
} as const;

interface GridBackgroundProperties {
	variant?: keyof typeof variants;
	className?: string;
}

export function GridBackground({ variant = 'dark', className }: GridBackgroundProperties) {
	return (
		<div className={cn('pointer-events-none absolute inset-0 bg-size-[20px_20px]', variants[variant], className)} aria-hidden="true" />
	);
}
