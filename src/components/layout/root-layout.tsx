import { Outlet, ScrollRestoration } from 'react-router-dom';
import { ModalProvider } from 'shadcn-modal-manager';

export function RootLayout() {
	return (
		<>
			<ModalProvider>
				<ScrollRestoration />
				<Outlet />
			</ModalProvider>
		</>
	);
}
