import { Suspense, useState } from 'react';
import { Helmet } from 'react-helmet-async';
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
import { useCustomQuizzes, useDeleteQuiz, usePredefinedQuizzes } from '@/hooks/use-api';
import { useUserId } from '@/hooks/use-user-id';
import { useTurnstile } from '@/hooks/utils/use-turnstile';

import type { Quiz } from '@shared/types';

export function HomePage() {
	const navigate = useViewTransitionNavigate();

	const { token: turnstileToken, resetToken, TurnstileWidget } = useTurnstile();
	const { userId, setUserId } = useUserId();

	// React Query hooks - queries are consumed with use() in QuizSections
	const predefinedQuizQuery = usePredefinedQuizzes();
	const customQuizQuery = useCustomQuizzes(userId);

	const deleteQuizMutation = useDeleteQuiz();

	// Dialog states
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [quizToDelete, setQuizToDelete] = useState<string | undefined>();

	const [startGameOpen, setStartGameOpen] = useState(false);
	const [selectedQuizForGame, setSelectedQuizForGame] = useState<Quiz | undefined>();

	const [musicCreditsOpen, setMusicCreditsOpen] = useState(false);
	const [syncDevicesOpen, setSyncDevicesOpen] = useState(false);

	const handleDeleteQuiz = (quizId: string) => {
		deleteQuizMutation.mutate(
			{ userId, quizId },
			{
				onSuccess: () => {
					toast.success('Quiz deleted!');
				},
				onError: () => {
					toast.error('Could not delete quiz.');
				},
			},
		);
	};

	const handleOpenDeleteDialog = (quizId: string) => {
		setQuizToDelete(quizId);
		setDeleteDialogOpen(true);
	};

	const handleConfirmDelete = () => {
		if (quizToDelete) {
			handleDeleteQuiz(quizToDelete);
			setQuizToDelete(undefined);
		}
	};

	const handleSelectQuiz = (quiz: Quiz) => {
		setSelectedQuizForGame(quiz);
		setStartGameOpen(true);
	};

	return (
		<div
			className="
				relative isolate min-h-screen w-full overflow-x-hidden bg-white font-sans
				selection:bg-black selection:text-white
			"
		>
			<GridBackground className="-z-10" />
			<Helmet>
				<title>Timoot - The Ultimate Multiplayer Quiz Game</title>
			</Helmet>
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
						startingQuizId={undefined}
						userId={userId}
						turnstileToken={turnstileToken}
						TurnstileWidget={TurnstileWidget}
						onResetTurnstile={resetToken}
						onSelectQuiz={handleSelectQuiz}
						onEditQuiz={(quizId) => navigate(`/edit/${quizId}`)}
						onDeleteQuiz={handleOpenDeleteDialog}
					/>
				</Suspense>
			</main>

			<HomeFooter onMusicCreditsClick={() => setMusicCreditsOpen(true)} onSyncDevicesClick={() => setSyncDevicesOpen(true)} />

			<DeleteQuizDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={handleConfirmDelete} />
			<StartGameDialog open={startGameOpen} onOpenChange={setStartGameOpen} selectedQuiz={selectedQuizForGame} />
			<MusicCreditsDialog open={musicCreditsOpen} onOpenChange={setMusicCreditsOpen} />
			<SyncDevicesDialog
				open={syncDevicesOpen}
				onOpenChange={setSyncDevicesOpen}
				userId={userId}
				customQuizCount={customQuizQuery.data?.length ?? 0}
				onSyncSuccess={setUserId}
			/>
		</div>
	);
}
