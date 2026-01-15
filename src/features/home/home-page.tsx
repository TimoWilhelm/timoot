import { Suspense, useState } from 'react';
import { toast } from 'sonner';

import { GridBackground } from '@/components/grid-background';
import { LoadingFallback } from '@/components/loading-fallback';
import {
	DeleteQuizDialog,
	HeroSection,
	HomeFooter,
	MusicCreditsDialog,
	QuizSections,
	StartGameDialog,
	SyncDevicesDialog,
} from '@/features/home/components';
import { useViewTransitionNavigate } from '@/hooks/ui/use-view-transition-navigate';
import { useCreateGame, useCustomQuizzes, useDeleteQuiz, usePredefinedQuizzes } from '@/hooks/use-api';
import { useUserId } from '@/hooks/use-user-id';
import { useTurnstile } from '@/hooks/utils/use-turnstile';
import { useHostStore } from '@/lib/stores/host-store';

import type { Quiz } from '@shared/types';

export function HomePage() {
	const navigate = useViewTransitionNavigate();
	const [startingQuizId, setStartingQuizId] = useState<string | undefined>();
	const [quizToDelete, setQuizToDelete] = useState<string | undefined>();
	const [selectedQuiz, setSelectedQuiz] = useState<Quiz | undefined>();
	const [isStartDialogOpen, setIsStartDialogOpen] = useState(false);
	const [isMusicCreditsOpen, setIsMusicCreditsOpen] = useState(false);
	const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false);
	const addSecret = useHostStore((s) => s.addSecret);
	const { token: turnstileToken, resetToken, TurnstileWidget } = useTurnstile();
	const { userId, setUserId } = useUserId();

	// React Query hooks - queries are consumed with use() in QuizSections
	const predefinedQuizQuery = usePredefinedQuizzes();
	const customQuizQuery = useCustomQuizzes(userId);

	const createGameMutation = useCreateGame();
	const deleteQuizMutation = useDeleteQuiz();

	const isGameStarting = createGameMutation.isPending;

	const handleStartGame = async (quizId: string) => {
		if (isGameStarting) return;
		if (!turnstileToken) {
			toast.error('Please complete the captcha verification first');
			return;
		}
		setStartingQuizId(quizId);
		createGameMutation.mutate(
			{
				header: { 'x-user-id': userId, 'x-turnstile-token': turnstileToken },
				json: { quizId },
			},
			{
				onSuccess: (result) => {
					if (result.success && result.data) {
						if ('error' in result.data && typeof result.data.error === 'string') {
							toast.error(result.data.error);
							setStartingQuizId(undefined);
							return;
						}
						if (result.data.id && result.data.hostSecret) {
							addSecret(result.data.id, result.data.hostSecret);
							navigate(`/host/${result.data.id}`);
						} else {
							toast.error('Game created, but missing ID or secret.');
							setStartingQuizId(undefined);
						}
					} else {
						toast.error('error' in result ? String(result.error) : 'Failed to create game');
						setStartingQuizId(undefined);
					}
				},
				onError: (error) => {
					console.error(error);
					toast.error(error.message || 'Could not start a new game. Please try again.');
					setStartingQuizId(undefined);
					resetToken();
				},
			},
		);
	};

	const handleDeleteQuiz = () => {
		if (!quizToDelete) return;
		deleteQuizMutation.mutate(
			{ userId, quizId: quizToDelete },
			{
				onSuccess: () => {
					toast.success('Quiz deleted!');
					setQuizToDelete(undefined);
				},
				onError: () => {
					toast.error('Could not delete quiz.');
					setQuizToDelete(undefined);
				},
			},
		);
	};

	const handleSelectQuiz = (quiz: Quiz) => {
		setSelectedQuiz(quiz);
		setIsStartDialogOpen(true);
	};

	return (
		<div
			className="
				relative isolate min-h-screen w-full overflow-x-hidden bg-white font-sans
				selection:bg-black selection:text-white
			"
		>
			<GridBackground className="-z-10" />
			<main
				className="
					relative mx-auto max-w-7xl px-4 py-8
					md:py-16
				"
			>
				<HeroSection />

				<div
					className="
						relative my-12 flex items-center justify-center
						sm:my-16
					"
				>
					<div aria-hidden="true" className="absolute inset-0 flex items-center">
						<div className="w-full border-t-2 border-slate" />
					</div>
					<div className="relative bg-white px-6">
						<span
							className="
								font-display text-sm font-bold tracking-widest text-black uppercase
							"
						>
							Or start your own game
						</span>
					</div>
				</div>

				<Suspense fallback={<LoadingFallback />}>
					<QuizSections
						predefinedQuizQuery={predefinedQuizQuery}
						customQuizQuery={customQuizQuery}
						startingQuizId={startingQuizId}
						userId={userId}
						turnstileToken={turnstileToken}
						TurnstileWidget={TurnstileWidget}
						onResetTurnstile={resetToken}
						onSelectQuiz={handleSelectQuiz}
						onEditQuiz={(quizId) => navigate(`/edit/${quizId}`)}
						onDeleteQuiz={setQuizToDelete}
					/>
				</Suspense>
			</main>

			<HomeFooter onMusicCreditsClick={() => setIsMusicCreditsOpen(true)} onSyncDevicesClick={() => setIsSyncDialogOpen(true)} />

			<StartGameDialog
				open={isStartDialogOpen}
				onOpenChange={setIsStartDialogOpen}
				selectedQuiz={selectedQuiz}
				isGameStarting={isGameStarting}
				turnstileToken={turnstileToken}
				TurnstileWidget={TurnstileWidget}
				onStartGame={() => selectedQuiz && handleStartGame(selectedQuiz.id)}
			/>

			<DeleteQuizDialog open={!!quizToDelete} onOpenChange={(open) => !open && setQuizToDelete(undefined)} onConfirm={handleDeleteQuiz} />

			<SyncDevicesDialog
				open={isSyncDialogOpen}
				onOpenChange={setIsSyncDialogOpen}
				userId={userId}
				customQuizCount={customQuizQuery.data?.length ?? 0}
				onSyncSuccess={setUserId}
			/>

			<MusicCreditsDialog open={isMusicCreditsOpen} onOpenChange={setIsMusicCreditsOpen} />
		</div>
	);
}
