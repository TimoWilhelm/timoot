import { GridBackground } from '@/components/grid-background';
import { cn } from '@/lib/utilities';

interface PlayerPageLayoutProperties {
	children: React.ReactNode;
	variant?: 'center' | 'game';
}

const variantStyles = {
	center: 'flex items-center justify-center overflow-y-auto p-4 overscroll-none',
	game: 'flex flex-col overflow-hidden p-4 overscroll-none',
};

export function PlayerPageLayout({ children, variant = 'center' }: PlayerPageLayoutProperties) {
	return (
		<div className={cn('fixed inset-0 isolate w-full text-white', variantStyles[variant])}>
			<div className="fixed inset-0 -z-20 bg-black" aria-hidden="true" />
			<GridBackground variant="dark" className="fixed -z-10" />
			{children}
		</div>
	);
}
