import { GridBackground } from '@/components/grid-background/grid-background';
import { cn } from '@/lib/utilities';

interface HostPageLayoutProperties {
	children: React.ReactNode;
	variant?: 'center' | 'game';
}

const variantStyles = {
	center: 'flex min-h-dvh items-center justify-center overflow-hidden p-4',
	game: 'flex min-h-dvh flex-col overflow-hidden selection:bg-black selection:text-white',
};

export function HostPageLayout({ children, variant = 'game' }: HostPageLayoutProperties) {
	return (
		<div className={cn('relative isolate min-h-screen w-full text-black', variantStyles[variant])}>
			<div className="absolute inset-0 -z-20 bg-white" aria-hidden="true" />
			<GridBackground className="-z-10" />
			{children}
		</div>
	);
}
