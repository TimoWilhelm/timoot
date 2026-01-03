import { GridBackground } from '@/components/ui/grid-background';
import { cn } from '@/lib/utilities';

interface PlayerPageLayoutProperties {
	children: React.ReactNode;
	variant?: 'center' | 'game';
}

const variantStyles = {
	center: 'flex min-h-dvh items-center justify-center overflow-auto p-4',
	game: 'flex min-h-dvh flex-col overflow-hidden p-4',
};

export function PlayerPageLayout({ children, variant = 'center' }: PlayerPageLayoutProperties) {
	return (
		<div className={cn('relative isolate min-h-screen w-full text-white', variantStyles[variant])}>
			<div className="absolute inset-0 -z-20 bg-black" aria-hidden="true" />
			<GridBackground variant="dark" className="-z-10" />
			{children}
		</div>
	);
}
