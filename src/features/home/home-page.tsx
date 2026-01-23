import { Suspense } from 'react';
import { ModalManager } from 'shadcn-modal-manager';
import { toast } from 'sonner';

import { GridBackground } from '@/components/grid-background';
import { LoadingFallback } from '@/components/loading-fallback';
import { Head } from '@/components/meta/head';
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

const handleSelectQuiz = (quiz: Quiz) => {
	ModalManager.open(StartGameDialog, { data: { selectedQuiz: quiz } });
};

export function HomePage() {
	const navigate = useViewTransitionNavigate();

	const { token: turnstileToken, resetToken, TurnstileWidget } = useTurnstile();
	const { userId, setUserId } = useUserId();

	// React Query hooks - queries are consumed with use() in QuizSections
	const predefinedQuizQuery = usePredefinedQuizzes();
	const customQuizQuery = useCustomQuizzes(userId);

	const deleteQuizMutation = useDeleteQuiz();

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

	return (
		<div
			className="
				relative isolate min-h-screen w-full overflow-x-hidden bg-white font-sans
				selection:bg-black selection:text-white
			"
		>
			<GridBackground className="-z-10" />
			<Head
				title="Timoot - The Ultimate Multiplayer Quiz Game"
				description="Join or host exciting quizzes with your friends! Create your own questions or choose from our curated list. Fast, fun, and free."
				jsonLd={[
					{
						'@context': 'https://schema.org',
						'@type': 'WebSite',
						name: 'Timoot',
						url: globalThis.window === undefined ? 'https://timoot.com' : globalThis.location.origin,
					},
					{
						'@context': 'https://schema.org',
						'@type': 'SoftwareApplication',
						name: 'Timoot',
						applicationCategory: 'Game',
						operatingSystem: 'Any',
					},
				]}
			/>
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
						onDeleteQuiz={async (quizId) => {
							const shouldDelete = await ModalManager.open(DeleteQuizDialog).afterClosed();
							if (shouldDelete) {
								handleDeleteQuiz(quizId);
							}
						}}
					/>
				</Suspense>
			</main>

			<HomeFooter
				onMusicCreditsClick={() => ModalManager.open(MusicCreditsDialog)}
				onSyncDevicesClick={() =>
					ModalManager.open(SyncDevicesDialog, {
						data: {
							userId,
							customQuizCount: customQuizQuery.data?.length ?? 0,
							onSyncSuccess: setUserId,
						},
					})
				}
			/>
		</div>
	);
}
