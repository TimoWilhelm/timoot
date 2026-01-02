import { cn } from '@/lib/utilities';
import { GridBackground } from '@/components/ui/grid-background';

interface PlayerPageLayoutProperties {
	children: React.ReactNode;
	className?: string;
}

export function PlayerPageLayout({ children, className }: PlayerPageLayoutProperties) {
	return (
		<div className={cn('relative min-h-screen w-full bg-black text-white', className)}>
			<GridBackground />
			{children}
		</div>
	);
}
