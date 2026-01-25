import { QueryClientProvider, QueryErrorResetBoundary } from '@tanstack/react-query';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';

import { RootLayout } from '@/components/layout';
import { Toaster } from '@/components/toast/toaster';
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
						<Toaster />
					</ErrorBoundary>
				)}
			</QueryErrorResetBoundary>
		</QueryClientProvider>
	);
}
