import { cn } from '@/lib/utilities';
import { GridBackground } from '@/components/ui/grid-background';

interface HostPageLayoutProperties {
	children: React.ReactNode;
	className?: string;
}

export function HostPageLayout({ children, className }: HostPageLayoutProperties) {
	return (
		<div className={cn('relative isolate min-h-screen w-full text-black', className)}>
			<div className="absolute inset-0 -z-20 bg-white" aria-hidden="true" />
			<GridBackground className="-z-10" />
			{children}
		</div>
	);
}
