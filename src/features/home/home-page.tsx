import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

import { GridBackground } from '@/components/grid-background/grid-background';
import {
	CustomQuizzesSection,
	DeleteQuizDialog,
	FeaturedQuizzesSection,
	HeroSection,
	HomeFooter,
	MusicCreditsDialog,
	StartGameDialog,
	SyncDevicesDialog,
} from '@/features/home/components';
import { useViewTransitionNavigate } from '@/hooks/ui/use-view-transition-navigate';
import {
	queryKeys,
	useCreateGame,
	useCustomQuizzes,
	useDeleteQuiz,
	useGenerateSyncCode,
	usePredefinedQuizzes,
	useRedeemSyncCode,
} from '@/hooks/use-api';
import { useUserId } from '@/hooks/use-user-id';
import { useTurnstile } from '@/hooks/utils/use-turnstile';
import { hcWithType } from '@/lib/clients/api-client';
import { consumeSSEStream } from '@/lib/clients/sse-client';
import { useHostStore } from '@/lib/stores/host-store';
import { LIMITS, aiPromptSchema } from '@shared/validation';

import type { Quiz, QuizGenerateSSEEvent } from '@shared/types';

export function HomePage() {
	const navigate = useViewTransitionNavigate();
	const [startingQuizId, setStartingQuizId] = useState<string | undefined>();
	const [aiPrompt, setAiPrompt] = useState('');
	const [isGenerating, setIsGenerating] = useState(false);
	const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
	const [generationStatus, setGenerationStatus] = useState<{ stage: string; detail?: string } | undefined>();
	const [generatingPrompt, setGeneratingPrompt] = useState<string | undefined>();
	const [quizToDelete, setQuizToDelete] = useState<string | undefined>();
	const [selectedQuiz, setSelectedQuiz] = useState<Quiz | undefined>();
	const [isStartDialogOpen, setIsStartDialogOpen] = useState(false);
	const [isMusicCreditsOpen, setIsMusicCreditsOpen] = useState(false);
	const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false);
	const [syncCode, setSyncCode] = useState<string | undefined>();
	const [_syncCodeExpiry, setSyncCodeExpiry] = useState<number | undefined>();
	const [syncCodeInput, setSyncCodeInput] = useState('');
	const [codeCopied, setCodeCopied] = useState(false);
	const [showSyncWarning, setShowSyncWarning] = useState(false);
	const addSecret = useHostStore((s) => s.addSecret);
	const generatingCardReference = useRef<HTMLDivElement>(null);
	const { token: turnstileToken, resetToken, TurnstileWidget } = useTurnstile();
	const { userId, setUserId } = useUserId();

	// React Query hooks
	const { data: predefinedQuizzes = [], isLoading: isLoadingPredefined } = usePredefinedQuizzes();
	const { data: customQuizzes = [], isLoading: isLoadingCustom } = useCustomQuizzes(userId);
	const isLoading = isLoadingPredefined || isLoadingCustom;

	const queryClient = useQueryClient();
	const createGameMutation = useCreateGame();
	const deleteQuizMutation = useDeleteQuiz();
	const generateSyncCodeMutation = useGenerateSyncCode();
	const redeemSyncCodeMutation = useRedeemSyncCode();

	const isGameStarting = createGameMutation.isPending;
	const isGeneratingSyncCode = generateSyncCodeMutation.isPending;
	const isRedeemingSyncCode = redeemSyncCodeMutation.isPending;

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
						if ('error' in result.data) {
							toast.error((result.data as { error: string }).error);
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

	const handleGenerateSyncCode = () => {
		generateSyncCodeMutation.mutate(
			{ header: { 'x-user-id': userId } },
			{
				onSuccess: (data) => {
					setSyncCode(data.code);
					setSyncCodeExpiry(Date.now() + data.expiresIn * 1000);
				},
				onError: (error) => {
					toast.error(error.message || 'Failed to generate sync code');
				},
			},
		);
	};

	const handleRedeemSyncCode = (confirmed = false) => {
		if (syncCodeInput.length !== 6) {
			toast.error('Please enter a 6-character code');
			return;
		}
		// Warn if user has existing custom quizzes
		if (!confirmed && customQuizzes.length > 0) {
			setShowSyncWarning(true);
			return;
		}
		setShowSyncWarning(false);
		redeemSyncCodeMutation.mutate(
			{ header: { 'x-user-id': userId }, json: { code: syncCodeInput.toUpperCase() } },
			{
				onSuccess: (data) => {
					setUserId(data.userId);
					toast.success('Device synced! Refreshing...');
					setIsSyncDialogOpen(false);
					// Reload to fetch data with new userId
					setTimeout(() => globalThis.location.reload(), 500);
				},
				onError: (error) => {
					toast.error(error.message || 'Failed to redeem sync code');
				},
			},
		);
	};

	const copyCodeToClipboard = () => {
		if (syncCode) {
			void navigator.clipboard.writeText(syncCode);
			setCodeCopied(true);
			setTimeout(() => setCodeCopied(false), 2000);
		}
	};

	const handleGenerateAiQuiz = async () => {
		if (customQuizzes.length >= LIMITS.MAX_QUIZZES_PER_USER) {
			toast.error(`You have reached the limit of ${LIMITS.MAX_QUIZZES_PER_USER} quizzes.`);
			return;
		}

		const result = aiPromptSchema.safeParse(aiPrompt);
		if (!result.success) {
			toast.error(z.prettifyError(result.error));
			return;
		}

		if (!turnstileToken) {
			toast.error('Please complete the captcha verification first');
			return;
		}

		const prompt = aiPrompt.trim();
		setGeneratingPrompt(prompt);
		setIsGenerating(true);
		setGenerationStatus(undefined);
		setAiPrompt('');
		setIsAiDialogOpen(false);

		// Scroll to generating card after state updates
		setTimeout(() => {
			generatingCardReference.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}, 100);

		const client = hcWithType('/');
		try {
			const response = await client.api.quizzes.generate.$post({
				header: { 'x-user-id': userId, 'x-turnstile-token': turnstileToken },
				json: { prompt, numQuestions: 5 },
			});

			await consumeSSEStream<QuizGenerateSSEEvent>(response, {
				onEvent: (event) => {
					switch (event.event) {
						case 'status': {
							setGenerationStatus(event.data);
							break;
						}
						case 'complete': {
							if (event.data.success && event.data.data) {
								toast.success(`Quiz "${event.data.data.title}" generated successfully!`);
								void queryClient.invalidateQueries({ queryKey: queryKeys.quizzes.custom(userId) });
							}
							break;
						}
						case 'error': {
							toast.error(event.data.error || 'Failed to generate quiz');
							break;
						}
					}
				},
				onError: (error) => {
					console.error(error);
					toast.error(error.message);
				},
			});
		} catch (error) {
			console.error(error);
			toast.error(error instanceof Error ? error.message : 'Could not generate quiz. Please try again.');
			resetToken();
		} finally {
			setIsGenerating(false);
			setGenerationStatus(undefined);
			setGeneratingPrompt(undefined);
		}
	};

	const handleSelectQuiz = (quiz: Quiz) => {
		setSelectedQuiz(quiz);
		setIsStartDialogOpen(true);
	};

	const handleOpenSyncDialog = () => {
		setSyncCode(undefined);
		setSyncCodeInput('');
		setIsSyncDialogOpen(true);
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

				{isLoading ? (
					<div className="flex justify-center py-20">
						<Loader2 className="size-16 animate-spin text-black" strokeWidth={3} />
					</div>
				) : (
					<div className="space-y-20">
						<FeaturedQuizzesSection quizzes={predefinedQuizzes} startingQuizId={startingQuizId} onSelectQuiz={handleSelectQuiz} />

						<CustomQuizzesSection
							quizzes={customQuizzes as Quiz[]}
							isGenerating={isGenerating}
							generatingPrompt={generatingPrompt}
							generationStatus={generationStatus}
							generatingCardRef={generatingCardReference}
							aiPrompt={aiPrompt}
							isAiDialogOpen={isAiDialogOpen}
							turnstileToken={turnstileToken}
							TurnstileWidget={TurnstileWidget}
							onAiPromptChange={setAiPrompt}
							onAiDialogOpenChange={setIsAiDialogOpen}
							onGenerateAiQuiz={handleGenerateAiQuiz}
							onSelectQuiz={handleSelectQuiz}
							onEditQuiz={(quizId) => navigate(`/edit/${quizId}`)}
							onDeleteQuiz={setQuizToDelete}
						/>
					</div>
				)}
			</main>

			<HomeFooter onMusicCreditsClick={() => setIsMusicCreditsOpen(true)} onSyncDevicesClick={handleOpenSyncDialog} />

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
				syncCode={syncCode}
				syncCodeInput={syncCodeInput}
				codeCopied={codeCopied}
				showSyncWarning={showSyncWarning}
				isGeneratingSyncCode={isGeneratingSyncCode}
				isRedeemingSyncCode={isRedeemingSyncCode}
				onSyncCodeInputChange={setSyncCodeInput}
				onGenerateSyncCode={handleGenerateSyncCode}
				onRedeemSyncCode={handleRedeemSyncCode}
				onCopyCode={copyCodeToClipboard}
				onCancelWarning={() => setShowSyncWarning(false)}
			/>

			<MusicCreditsDialog open={isMusicCreditsOpen} onOpenChange={setIsMusicCreditsOpen} />
		</div>
	);
}
