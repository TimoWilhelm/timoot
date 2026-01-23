import { Outlet, ScrollRestoration } from 'react-router-dom';
import { ModalProvider } from 'shadcn-modal-manager';

import { Head } from '@/components/meta/head';

export function RootLayout() {
	return (
		<>
			<ModalProvider>
				<Head title="Timoot" description="A fun multiplayer quiz game" />
				<ScrollRestoration />
				<Outlet />
			</ModalProvider>
		</>
	);
}
