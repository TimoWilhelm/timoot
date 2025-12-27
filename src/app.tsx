import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { ErrorBoundary, RouteErrorBoundary } from '@/components/error';
import { queryClient } from '@/lib/query-client';
import { HomePage } from '@/pages/home-page';
import { HostPage } from '@/pages/host-page';
import { PlayerPage } from '@/pages/player-page';
import { QuizEditorPage } from '@/pages/quiz-editor-page';
const router = createBrowserRouter([
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
]);
export function App() {
	return (
		<ErrorBoundary>
			<QueryClientProvider client={queryClient}>
				<RouterProvider router={router} />
			</QueryClientProvider>
		</ErrorBoundary>
	);
}
