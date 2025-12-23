import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { ErrorBoundary, RouteErrorBoundary } from '@/components/error';
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
			<RouterProvider router={router} />
		</ErrorBoundary>
	);
}
