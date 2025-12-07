import React from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';

type AppLayoutProps = {
	children: React.ReactNode;
	container?: boolean;
	className?: string;
	contentClassName?: string;
};

export function AppLayout({ children, container = false, className, contentClassName }: AppLayoutProps): JSX.Element {
	return (
		<SidebarProvider defaultOpen={false}>
			<AppSidebar />
			<SidebarInset className={className}>
				<div className="absolute left-2 top-2 z-20">
					<SidebarTrigger />
				</div>
				{container ? (
					<div
						className={'mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-10 lg:px-8 lg:py-12' + (contentClassName ? ` ${contentClassName}` : '')}
					>
						{children}
					</div>
				) : (
					children
				)}
			</SidebarInset>
		</SidebarProvider>
	);
}
