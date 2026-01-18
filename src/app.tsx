import { QueryClientProvider, QueryErrorResetBoundary } from '@tanstack/react-query';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';

import { RootLayout } from '@/components/layout';
import { ErrorBoundary, RouteErrorBoundary } from '@/features/error';
import { HostPage } from '@/features/game/host/host-page';
import { PlayerPage } from '@/features/game/player/player-page';
import { HomePage } from '@/features/home/home-page';
import { QuizEditorPage } from '@/features/quiz-editor/quiz-editor-page';
import { queryClient } from '@/lib/clients/query-client';

const router = createBrowserRouter([
	{
		element: <RootLayout />,
		errorElement: <RouteErrorBoundary />,
		children: [
			{
				path: '/',
				element: <HomePage />,
				errorElement: <RouteErrorBoundary />,
			},
			{
				path: '/host/:gameId',
				element: <HostPage />,
				errorElement: <RouteErrorBoundary />,
			},
			{
				path: '/play',
				element: <PlayerPage />,
				errorElement: <RouteErrorBoundary />,
			},
			{
				path: '/edit/:quizId?',
				element: <QuizEditorPage />,
				errorElement: <RouteErrorBoundary />,
			},
		],
	},
]);

export function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<QueryErrorResetBoundary>
				{({ reset }) => (
					<ErrorBoundary key={String(reset)}>
						<RouterProvider router={router} />
						<Toaster
							closeButton
							toastOptions={{
								classNames: {
									toast: 'bg-white text-black border-2 border-black shadow-brutal rounded-xl p-4 gap-4 flex items-center w-full font-sans',
									title: 'font-display font-bold text-xl text-black',
									description: 'text-muted-foreground text-base',
									actionButton: 'bg-black text-white hover:bg-black/90 font-bold font-sans rounded-md text-sm',
									cancelButton: 'bg-white text-black border-2 border-black hover:bg-gray-100 font-bold font-sans rounded-md text-sm',
									closeButton:
										'bg-white hover:bg-gray-100 border-2 border-black text-black rounded-md top-2 right-2 grid place-items-center',
									error: '!text-red-600',
									success: '!text-green-600',
									warning: '!text-yellow-600',
									info: '!text-blue-600',
								},
							}}
						/>
					</ErrorBoundary>
				)}
			</QueryErrorResetBoundary>
		</QueryClientProvider>
	);
}
