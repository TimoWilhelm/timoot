import { useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import {
	BookOpen,
	Check,
	Copy,
	Gamepad2,
	HelpCircle,
	Loader2,
	Music,
	Pencil,
	Plus,
	RefreshCw,
	Sparkles,
	Trash2,
	Wand2,
	Zap,
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { z } from 'zod';
import { motion } from 'framer-motion';
import type { Quiz, QuizGenerateSSEEvent } from '@shared/types';
import { LIMITS, aiPromptSchema } from '@shared/validation';
import { musicCredits } from '@shared/music-credits';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utilities';
import { useHostStore } from '@/lib/host-store';
import { consumeSSEStream } from '@/lib/sse-client';
import { hcWithType } from '@/lib/api-client';
import {
	queryKeys,
	useCreateGame,
	useCustomQuizzes,
	useDeleteQuiz,
	useGenerateSyncCode,
	usePredefinedQuizzes,
	useRedeemSyncCode,
} from '@/hooks/use-api';
import { useTurnstile } from '@/hooks/use-turnstile';
import { useUserId } from '@/hooks/use-user-id';
import { useViewTransitionNavigate } from '@/hooks/use-view-transition-navigate';

function getStatusMessage(status: { stage: string; detail?: string } | undefined): string {
	if (!status) return 'Preparing...';
	switch (status.stage) {
		case 'researching': {
			return `Researching ${status.detail || 'topic'}...`;
		}
		case 'reading_docs': {
			return `Reading documentation for ${status.detail || 'topic'}...`;
		}
		case 'searching_web': {
			return `Searching the web for ${status.detail || 'relevant information'}...`;
		}
		case 'generating': {
			return 'Generating quiz questions...';
		}
		default: {
			return 'Processing...';
		}
	}
}

// Neo-Brutalist Component Styles
const BRUTAL_CARD_BASE =
	'relative overflow-hidden rounded-xl border-2 border-black bg-white shadow-brutal-sm transition-all duration-200 hover:-translate-y-px hover:shadow-brutal active:translate-y-0 active:shadow-none';
const BRUTAL_INPUT =
	'rounded-lg border-2 border-black bg-white px-4 py-2 font-medium shadow-brutal-inset focus:outline-hidden focus:ring-2 focus:ring-black focus:ring-offset-2';

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
		resetToken();
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
							toast.success('New game created!');
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
		if (!turnstileToken) {
			toast.error('Please complete the captcha verification first');
			return;
		}
		resetToken();
		generateSyncCodeMutation.mutate(
			{ header: { 'x-user-id': userId, 'x-turnstile-token': turnstileToken } },
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

		resetToken();
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
		} finally {
			setIsGenerating(false);
			setGenerationStatus(undefined);
			setGeneratingPrompt(undefined);
		}
	};

	return (
		<div
			className="
				relative min-h-screen w-full overflow-x-hidden bg-[#fafafa] font-sans
				selection:bg-black selection:text-white
			"
		>
			{/* Decorative Background Grid */}
			<div
				className="
					absolute inset-0 bg-[radial-gradient(#d4d4d8_1px,transparent_1px)]
					bg-size-[20px_20px] opacity-50
				"
			/>

			<main
				className="
					relative z-10 mx-auto max-w-7xl px-4 py-8
					md:py-16
				"
			>
				{/* Hero Section */}
				<header className="mb-20 flex flex-col items-center justify-center text-center">
					{/* Logo / Badge */}
					<motion.div
						initial={{ scale: 0.9, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						className="
							mb-8 inline-block -rotate-2 rounded-full border-2 border-black
							bg-yellow-300 px-6 py-2 shadow-brutal
						"
					>
						<span
							className="
								font-display text-lg font-bold tracking-wider text-black uppercase
							"
						>
							The Ultimate Quiz Game
						</span>
					</motion.div>

					<motion.h1
						initial={{ y: 20, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						transition={{ delay: 0.1 }}
						className="
							mb-8 font-display text-7xl leading-tight font-black tracking-tighter
							text-black uppercase
							sm:text-8xl
							md:text-9xl
							lg:text-[10rem]
						"
					>
						TIM<span className="text-quiz-orange">OOT</span>
					</motion.h1>

					<motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="relative z-20">
						<Button
							onClick={() => navigate('/play')}
							variant="primary"
							className="
								group relative inline-flex items-center gap-4 rounded-xl px-12 py-10
								text-4xl uppercase shadow-brutal
								hover:-translate-y-0.5 hover:shadow-brutal-lg
								active:translate-y-0 active:shadow-brutal-sm
							"
						>
							<Gamepad2
								className="
									size-8 transition-transform
									group-hover:rotate-12
								"
								strokeWidth={2.5}
							/>
							<span>Join Game</span>
						</Button>
					</motion.div>
				</header>

				{isLoading ? (
					<div className="flex justify-center py-20">
						<Loader2 className="size-16 animate-spin text-black" strokeWidth={3} />
					</div>
				) : (
					<div className="space-y-20">
						{/* Featured Quizzes */}
						<section>
							<div
								className="
									mb-8 flex items-end justify-between border-b-4 border-black pb-4
								"
							>
								<h2
									className="
										font-display text-4xl font-bold uppercase
										md:text-5xl
									"
								>
									Featured
								</h2>
								<div
									className="
										hidden items-center gap-2 font-bold
										md:flex
									"
								>
									<Zap className="fill-black text-black" />
									<span>TOP PICKS</span>
								</div>
							</div>

							<div
								className="
									grid gap-6
									sm:grid-cols-2
									lg:grid-cols-3
								"
							>
								{predefinedQuizzes.map((quiz, index) => (
									<motion.div
										key={quiz.id}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: index * 0.05 }}
									>
										<button
											type="button"
											onClick={() => {
												setSelectedQuiz(quiz);
												setIsStartDialogOpen(true);
											}}
											className={cn(
												BRUTAL_CARD_BASE,
												`
													group size-full cursor-pointer bg-white p-6 text-left
													hover:bg-yellow-50
												`,
												startingQuizId === quiz.id && 'bg-yellow-100 ring-2 ring-black ring-offset-2',
											)}
										>
											<div className="mb-4 flex items-start justify-between">
												<div
													className="
														rounded-lg border-2 border-black bg-blue-400 p-3 shadow-brutal-sm
														transition-transform
														group-hover:rotate-6
													"
												>
													<Zap className="size-6 text-white" fill="currentColor" />
												</div>
												<span
													className="
														rounded-full border-2 border-black px-3 py-1 text-xs font-bold
														uppercase
													"
												>
													{quiz.questions.length} Qs
												</span>
											</div>
											<h3 className="mb-2 font-display text-2xl leading-tight font-bold">{quiz.title}</h3>
											<p className="line-clamp-2 text-sm font-medium text-gray-600">
												Ready to challenge your friends? Click to start this quiz instantly.
											</p>
											{startingQuizId === quiz.id && (
												<div
													className="
														absolute inset-0 flex items-center justify-center bg-white/50
														backdrop-blur-xs
													"
												>
													<Loader2 className="size-8 animate-spin text-black" />
												</div>
											)}
										</button>
									</motion.div>
								))}
							</div>
						</section>

						{/* Custom Quizzes */}
						<section>
							<div
								className="
									mb-8 flex items-end justify-between border-b-4 border-black pb-4
								"
							>
								<h2
									className="
										font-display text-4xl font-bold uppercase
										md:text-5xl
									"
								>
									Your Quizzes
								</h2>
								<div
									className="
										hidden items-center gap-2 font-bold
										md:flex
									"
								>
									<BookOpen className="fill-black text-black" />
									<span>LIBRARY</span>
								</div>
							</div>

							<div
								className="
									grid gap-6
									sm:grid-cols-2
									lg:grid-cols-3
								"
							>
								{/* Create New Card */}
								<motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="order-first">
									<button
										type="button"
										onClick={() => navigate('/edit')}
										className={cn(
											BRUTAL_CARD_BASE,
											`
												group flex size-full cursor-pointer flex-col items-center
												justify-center gap-4 bg-gray-50 p-6 text-center
												hover:bg-blue-50
											`,
										)}
									>
										<div
											className="
												flex size-16 items-center justify-center rounded-full border-2
												border-black bg-blue-400 shadow-brutal transition-transform
												group-hover:scale-110 group-hover:rotate-12
											"
										>
											<Plus className="size-8 text-white" strokeWidth={4} />
										</div>
										<h3 className="font-display text-2xl font-bold">Create New</h3>
									</button>
								</motion.div>

								{/* AI Generate Trigger */}
								<motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
									<Dialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen}>
										<DialogTrigger asChild>
											<button
												type="button"
												className={cn(
													BRUTAL_CARD_BASE,
													`
														group flex size-full cursor-pointer flex-col items-center
														justify-center gap-4 bg-gray-50 p-6 text-center
														hover:bg-purple-50
													`,
												)}
											>
												<div
													className="
														flex size-16 items-center justify-center rounded-full border-2
														border-black bg-purple-400 shadow-brutal transition-transform
														group-hover:scale-110 group-hover:-rotate-12
													"
												>
													<Wand2 className="size-8 text-white" strokeWidth={2.5} />
												</div>
												<h3 className="font-display text-2xl font-bold">Magic Quiz</h3>
											</button>
										</DialogTrigger>
										<DialogContent
											className="
												overflow-hidden border-4 border-black p-0
												sm:max-w-[425px]
											"
										>
											<div className="bg-purple-400 p-6">
												<DialogHeader>
													<DialogTitle
														className="
															flex items-center gap-3 font-display text-3xl font-bold
															text-black uppercase
														"
													>
														<Wand2 className="size-8" />
														Magic Quiz
													</DialogTitle>
													<DialogDescription className="text-black/70">
														Describe your topic and let AI do the heavy lifting.
													</DialogDescription>
												</DialogHeader>
											</div>
											<div className="space-y-6 p-6">
												<div className="space-y-2">
													<Label htmlFor="ai-prompt" className="font-bold uppercase">
														Topic or Theme
													</Label>
													<Input
														id="ai-prompt"
														placeholder="e.g. 90s Pop Music, Quantum Physics, Cat Breeds..."
														value={aiPrompt}
														onChange={(event) => setAiPrompt(event.target.value)}
														onKeyDown={(event) => event.key === 'Enter' && handleGenerateAiQuiz()}
														className={BRUTAL_INPUT}
														maxLength={LIMITS.AI_PROMPT_MAX}
													/>
													<p className="text-right text-xs font-bold text-gray-400">
														{aiPrompt.length}/{LIMITS.AI_PROMPT_MAX}
													</p>
												</div>
												<TurnstileWidget className="flex justify-center" />
												<Button
													onClick={handleGenerateAiQuiz}
													disabled={aiPrompt.trim().length < LIMITS.AI_PROMPT_MIN || !turnstileToken}
													variant="primary"
													className="w-full rounded-xl py-6 text-lg"
												>
													{aiPrompt.trim().length < LIMITS.AI_PROMPT_MIN ? (
														'Add Topic...'
													) : (
														<>
															<Sparkles className="mr-2 size-5" /> Generate Magic Quiz
														</>
													)}
												</Button>
											</div>
										</DialogContent>
									</Dialog>
								</motion.div>

								{/* Generating Card State */}
								{isGenerating && (
									<motion.div
										ref={generatingCardReference}
										initial={{ opacity: 0, scale: 0.9 }}
										animate={{ opacity: 1, scale: 1 }}
										className="col-span-full"
									>
										<div
											className="
												relative overflow-hidden rounded-xl border-4 border-black bg-black
												p-1 shadow-brutal-lg
											"
										>
											<div
												className="
													absolute inset-0 animate-spin
													bg-[conic-gradient(from_0deg,transparent_0_340deg,white_360deg)]
													opacity-20
												"
											/>
											<div className="relative h-full rounded-lg bg-white p-6">
												<div className="flex items-center gap-4">
													<div
														className="
															flex size-12 shrink-0 items-center justify-center rounded-full
															border-2 border-black bg-yellow-300
														"
													>
														<Loader2 className="size-6 animate-spin text-black" />
													</div>
													<div className="flex-1">
														<h3 className="font-display text-xl font-bold">Generating: {generatingPrompt}</h3>
														<p className="font-mono text-sm text-gray-500">{getStatusMessage(generationStatus)}</p>
													</div>
												</div>
											</div>
										</div>
									</motion.div>
								)}

								{/* User Quizzes List */}
								{customQuizzes.map((quiz, index) => (
									<motion.div
										key={quiz.id}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: index * 0.05 }}
									>
										<button
											type="button"
											onClick={() => {
												setSelectedQuiz(quiz);
												setIsStartDialogOpen(true);
											}}
											className={cn(
												BRUTAL_CARD_BASE,
												`
													group flex size-full cursor-pointer flex-col justify-between p-6
													text-left
												`,
												startingQuizId === quiz.id && 'bg-yellow-50',
											)}
										>
											<div className="mb-4">
												<div className="mb-3 flex items-center justify-between">
													<div
														className="
															rounded-lg border-2 border-black bg-pink-400 p-2 shadow-brutal-sm
															transition-transform
															group-hover:rotate-3
														"
													>
														<Pencil className="size-5 text-white" />
													</div>
													<div className="flex gap-2">
														<button
															onClick={(event) => {
																event.stopPropagation();
																navigate(`/edit/${quiz.id}`);
															}}
															className="
																cursor-pointer rounded-md border-2 border-transparent p-1
																hover-always:border-black hover-always:bg-gray-100
															"
														>
															<Pencil className="size-4" />
														</button>
														<button
															onClick={(event) => {
																event.stopPropagation();
																setQuizToDelete(quiz.id);
															}}
															className="
																cursor-pointer rounded-md border-2 border-transparent p-1
																text-red-500
																hover-always:border-black hover-always:bg-red-50
															"
														>
															<Trash2 className="size-4" />
														</button>
													</div>
												</div>
												<h3
													className="
														line-clamp-2 font-display text-xl leading-tight font-bold
													"
												>
													{quiz.title}
												</h3>
											</div>
											<div className="flex items-center gap-2 text-sm font-bold text-gray-500">
												<HelpCircle className="size-4" />
												{quiz.questions.length} Questions
											</div>
										</button>
									</motion.div>
								))}
							</div>
						</section>
					</div>
				)}
			</main>

			{/* Footer */}
			<footer className="relative z-10 border-t-4 border-black bg-white px-4 py-6">
				<div
					className="
						flex flex-col items-center justify-center gap-3
						sm:flex-row sm:gap-6
					"
				>
					<a
						href="https://github.com/TimoWilhelm/timoot"
						target="_blank"
						rel="noopener noreferrer"
						className={`
							inline-flex items-center gap-2 rounded-lg border-2 border-black
							bg-gray-100 px-4 py-2 text-sm font-bold uppercase shadow-brutal-sm
							transition-all
							hover:-translate-y-px hover:bg-yellow-300 hover:shadow-brutal
							active:translate-y-0 active:shadow-none
						`}
					>
						<img src="/icons/github-mark.svg" alt="GitHub" className="size-4" />
						Open Source
					</a>
					<button
						onClick={() => setIsMusicCreditsOpen(true)}
						className={`
							inline-flex cursor-pointer items-center gap-2 rounded-lg border-2
							border-black bg-gray-100 px-4 py-2 text-sm font-bold uppercase
							shadow-brutal-sm transition-all
							hover:-translate-y-px hover:bg-quiz-orange hover:text-white
							hover:shadow-brutal
							active:translate-y-0 active:shadow-none
						`}
					>
						<Music className="size-4" />
						Music Credits
					</button>
					<button
						onClick={() => {
							setSyncCode(undefined);
							setSyncCodeInput('');
							setIsSyncDialogOpen(true);
						}}
						className={`
							inline-flex cursor-pointer items-center gap-2 rounded-lg border-2
							border-black bg-gray-100 px-4 py-2 text-sm font-bold uppercase
							shadow-brutal-sm transition-all
							hover:-translate-y-px hover:bg-blue-400 hover:text-white
							hover:shadow-brutal
							active:translate-y-0 active:shadow-none
						`}
					>
						<RefreshCw className="size-4" />
						Sync Devices
					</button>
				</div>
			</footer>

			{/* Start Game Dialog */}
			<Dialog open={isStartDialogOpen} onOpenChange={(open) => !isGameStarting && setIsStartDialogOpen(open)}>
				<DialogContent className="overflow-hidden border-4 border-black p-0 sm:max-w-[425px]">
					<div className="bg-yellow-300 p-6">
						<DialogHeader>
							<DialogTitle
								className="
									font-display text-3xl font-black tracking-tight text-black uppercase
								"
							>
								Start Game?
							</DialogTitle>
						</DialogHeader>
					</div>
					<div className="p-6">
						<div
							className="
								mb-6 rounded-xl border-2 border-black bg-white p-4 shadow-brutal-sm
							"
						>
							<h4
								className="
									mb-2 text-xs font-bold tracking-wider text-gray-500 uppercase
								"
							>
								Selected Quiz
							</h4>
							<p className="font-display text-xl font-bold">{selectedQuiz?.title}</p>
							<div className="mt-2 flex items-center gap-2 font-mono text-sm">
								<span className="rounded-sm bg-black px-2 py-0.5 text-white">{selectedQuiz?.questions.length} Qs</span>
							</div>
						</div>
						<TurnstileWidget className="mb-4 flex justify-center" />
						<div className="flex gap-3">
							<Button
								onClick={() => selectedQuiz && handleStartGame(selectedQuiz.id)}
								disabled={isGameStarting || !turnstileToken}
								variant="primary"
								className="w-full rounded-xl py-6 text-lg"
							>
								{isGameStarting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Gamepad2 className="mr-2 size-4" />}
								Let's Play
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation */}
			<AlertDialog open={!!quizToDelete} onOpenChange={(open) => !open && setQuizToDelete(undefined)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className="font-display text-2xl font-bold text-red-600 uppercase">Delete Quiz?</AlertDialogTitle>
						<AlertDialogDescription className="text-base font-medium text-black">
							This action cannot be undone. This will permanently delete your quiz from our servers.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="border-2 border-black font-bold">Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleDeleteQuiz} variant="destructive">
							Yes, Delete it
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Sync Dialog */}
			<Dialog open={isSyncDialogOpen} onOpenChange={setIsSyncDialogOpen}>
				<DialogContent className="sm:max-w-[425px]">
					<div className="bg-blue-400 p-6 text-white">
						<DialogHeader>
							<DialogTitle
								className="
									flex items-center gap-2 font-display text-2xl font-bold uppercase
								"
							>
								<RefreshCw className="size-6" />
								Sync Devices
							</DialogTitle>
						</DialogHeader>
					</div>
					<div className="space-y-6 p-6">
						{/* Generate Code */}
						<div className="space-y-2">
							<h4 className="font-bold uppercase">Share from here</h4>
							{syncCode ? (
								<div className="flex items-center gap-2">
									<div
										className="
											flex-1 rounded-xl border-2 border-black bg-gray-100 p-3 text-center
											font-mono text-2xl font-bold tracking-widest
										"
									>
										{syncCode}
									</div>
									<Button
										onClick={copyCodeToClipboard}
										size="icon"
										className="
											size-14 shrink-0 rounded-xl border-2 border-black shadow-brutal
										"
									>
										{codeCopied ? <Check className="size-6" /> : <Copy className="size-6" />}
									</Button>
								</div>
							) : (
								<div className="space-y-2">
									<TurnstileWidget className="flex justify-center" />
									<Button
										onClick={handleGenerateSyncCode}
										disabled={isGeneratingSyncCode || !turnstileToken}
										className="w-full border-2 border-black font-bold shadow-brutal"
									>
										Generate Code
									</Button>
								</div>
							)}
						</div>

						<div className="relative py-2">
							<div className="absolute inset-0 flex items-center">
								<span className="w-full border-t-2 border-dashed border-gray-300" />
							</div>
							<div
								className="
									relative flex justify-center text-xs font-bold tracking-widest
									uppercase
								"
							>
								<span className="bg-white px-2 text-gray-400">OR</span>
							</div>
						</div>

						{/* Redeem Code */}
						<div className="space-y-2">
							<h4 className="font-bold uppercase">Sync to here</h4>
							{showSyncWarning ? (
								<div className="rounded-xl border-2 border-black bg-yellow-100 p-4">
									<p className="mb-2 text-sm font-bold text-yellow-800">Warning: Existing Data</p>
									<p className="mb-4 text-xs">Syncing will replace your current quizzes. Are you sure?</p>
									<div className="flex gap-2">
										<Button size="sm" variant="secondary" onClick={() => setShowSyncWarning(false)} className="border-black bg-white">
											Cancel
										</Button>
										<Button size="sm" onClick={() => handleRedeemSyncCode(true)} className="border-black bg-yellow-400 text-black">
											Overwrite & Sync
										</Button>
									</div>
								</div>
							) : (
								<div className="flex gap-2">
									<Input
										placeholder="ENTER CODE"
										value={syncCodeInput}
										onChange={(event) => setSyncCodeInput(event.target.value.toUpperCase())}
										className={cn(BRUTAL_INPUT, 'flex-1 text-center font-mono tracking-widest uppercase')}
										maxLength={6}
									/>
									<Button
										onClick={() => handleRedeemSyncCode(false)}
										disabled={isRedeemingSyncCode || syncCodeInput.length !== 6}
										className="border-2 border-black bg-black text-white shadow-brutal"
									>
										<Check className="size-5" />
									</Button>
								</div>
							)}
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Music Credits Dialog */}
			<Dialog open={isMusicCreditsOpen} onOpenChange={setIsMusicCreditsOpen}>
				<DialogContent className="sm:max-w-[500px]">
					<div className="bg-quiz-orange p-6 text-white">
						<DialogHeader>
							<DialogTitle
								className="
									flex items-center gap-2 font-display text-2xl font-bold uppercase
								"
							>
								<Music className="size-6" />
								Music Credits
							</DialogTitle>
						</DialogHeader>
					</div>
					<div className="max-h-[400px] space-y-4 overflow-y-auto p-6">
						{musicCredits.map((credit) => (
							<div
								key={credit.title}
								className="
									rounded-xl border-2 border-black bg-gray-50 p-4 shadow-brutal-sm
								"
							>
								<p className="mb-1 font-display text-lg font-bold">"{credit.title}"</p>
								<div className="space-y-1 text-sm">
									<p>
										By:{' '}
										<a
											href={credit.artistUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="
												cursor-pointer font-bold text-quiz-orange underline
												hover:text-black
											"
										>
											{credit.artist}
										</a>
									</p>
									<p className="text-gray-500">
										License:{' '}
										<a
											href={credit.licenseUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="
												cursor-pointer underline
												hover:text-black
											"
										>
											{credit.license}
										</a>
									</p>
								</div>
							</div>
						))}
					</div>
				</DialogContent>
			</Dialog>

			<Toaster richColors closeButton />
		</div>
	);
}
