import { cn } from '@/lib/utilities';
import { GridBackground } from '@/components/ui/grid-background';

interface HostPageLayoutProperties {
	children: React.ReactNode;
	className?: string;
}

export function HostPageLayout({ children, className }: HostPageLayoutProperties) {
	return (
		<div className={cn('relative min-h-screen w-full bg-white text-black', className)}>
			<GridBackground variant="light" />
			{children}
		</div>
	);
}
