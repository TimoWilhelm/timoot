import { cn } from '@/lib/utilities';
import { GridBackground } from '@/components/ui/grid-background';

interface PlayerPageLayoutProperties {
	children: React.ReactNode;
	className?: string;
}

export function PlayerPageLayout({ children, className }: PlayerPageLayoutProperties) {
	return (
		<div className={cn('relative isolate min-h-screen w-full text-white', className)}>
			<div className="absolute inset-0 -z-20 bg-black" aria-hidden="true" />
			<GridBackground variant="dark" className="-z-10" />
			{children}
		</div>
	);
}
