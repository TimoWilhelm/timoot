import { useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	BookOpen,
	Check,
	Copy,
	Gamepad2,
	HelpCircle,
	Loader2,
	Music,
	Pencil,
	PlusCircle,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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

export function HomePage() {
	const navigate = useNavigate();
	const [startingQuizId, setStartingQuizId] = useState<string | undefined>();
	const [aiPrompt, setAiPrompt] = useState('');
	const [isGenerating, setIsGenerating] = useState(false);
	const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
	const [generationStatus, setGenerationStatus] = useState<{ stage: string; detail?: string } | undefined>();
	const [generatingPrompt, setGeneratingPrompt] = useState<string | undefined>();
	const [quizToDelete, setQuizToDelete] = useState<string | undefined>();
	const [selectedQuiz, setSelectedQuiz] = useState<Quiz | undefined>();
	const [isMusicCreditsOpen, setIsMusicCreditsOpen] = useState(false);
	const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false);
	const [syncCode, setSyncCode] = useState<string | undefined>();
	const [syncCodeExpiry, setSyncCodeExpiry] = useState<number | undefined>();
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
		<div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-slate-50 text-slate-900">
			{/* Background gradient */}
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-100/50 via-amber-50/30 to-slate-50 opacity-50" />
			{/* Main content */}
			<main className="relative z-10 flex-1 px-4 py-8 md:py-12">
				<div className="mx-auto max-w-6xl animate-fade-in space-y-12">
					{/* Hero Section */}
					<header className="space-y-6 text-center">
						<div className="flex justify-center">
							<div className="flex h-20 w-20 animate-float items-center justify-center rounded-3xl bg-gradient-to-br from-quiz-orange to-quiz-gold shadow-xl shadow-quiz-orange/20 md:h-28 md:w-28">
								<Sparkles className="h-10 w-10 text-white md:h-14 md:w-14" />
							</div>
						</div>
						<div className="space-y-3">
							<h1 className="text-balance font-display text-4xl font-bold leading-tight sm:text-5xl md:text-6xl lg:text-7xl">
								Welcome to <span className="text-gradient">Timoot</span>
							</h1>
							<p className="mx-auto max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
								Select a quiz to begin the fun, or create your own!
							</p>
						</div>
						{/* Join Game Button */}
						<div className="pt-6">
							<Button
								size="lg"
								onClick={() => navigate('/play')}
								className="group relative h-16 overflow-hidden rounded-2xl bg-gradient-to-r from-quiz-orange to-quiz-gold px-12 text-xl font-bold text-white shadow-2xl shadow-quiz-orange/30 transition-all duration-300 hover:-translate-y-1.5 hover:scale-105 hover:shadow-[0_20px_50px_-12px] hover:shadow-quiz-orange/50 active:scale-95 sm:h-20 sm:px-16 sm:text-2xl"
							>
								<span className="absolute inset-0 bg-gradient-to-r from-quiz-gold to-quiz-orange opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
								<span className="relative flex items-center gap-3">
									<span className="wiggle-on-hover">
										<Gamepad2 style={{ width: 40, height: 40 }} />
									</span>
									Join Game
								</span>
							</Button>
						</div>
					</header>
					{isLoading ? (
						<div className="flex items-center justify-center py-20">
							<Loader2 className="h-16 w-16 animate-spin text-quiz-orange" />
						</div>
					) : (
						<div className="space-y-12">
							{/* Featured Quizzes Section */}
							<section>
								<div className="mb-6 flex items-center gap-3">
									<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-quiz-orange/10">
										<Zap className="h-5 w-5 text-quiz-orange" />
									</div>
									<div>
										<h2 className="text-2xl font-bold">Featured Quizzes</h2>
										<p className="text-sm text-muted-foreground">Curated quizzes ready to play</p>
									</div>
								</div>
								<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
									{predefinedQuizzes.map((quiz, index) => (
										<motion.div
											key={quiz.id}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: index * 0.08 }}
										>
											<Card
												onClick={() => setSelectedQuiz(quiz)}
												className={cn(
													'group h-full cursor-pointer rounded-2xl border-2 transition-all duration-300',
													'hover:-translate-y-1 hover:shadow-xl hover:shadow-quiz-orange/10',
													startingQuizId === quiz.id
														? 'border-quiz-orange bg-gradient-to-br from-quiz-orange/5 to-quiz-gold/5 shadow-lg shadow-quiz-orange/10'
														: 'border-transparent hover:border-quiz-orange/30',
												)}
											>
												<CardHeader className="pb-3">
													<div className="flex items-start justify-between">
														<CardTitle className="flex items-center gap-2 text-xl transition-colors group-hover:text-quiz-orange">
															{quiz.title}
															{startingQuizId === quiz.id && <Loader2 className="h-4 w-4 animate-spin" />}
														</CardTitle>
													</div>
												</CardHeader>
												<CardContent className="pt-0">
													<div className="flex items-center gap-1.5 text-sm text-muted-foreground">
														<HelpCircle className="h-4 w-4" />
														<span>{quiz.questions.length} questions</span>
													</div>
												</CardContent>
											</Card>
										</motion.div>
									))}
								</div>
							</section>
							{/* Your Quizzes Section */}
							<section>
								<div className="mb-6 flex items-center gap-3">
									<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
										<BookOpen className="h-5 w-5 text-blue-500" />
									</div>
									<div>
										<h2 className="text-2xl font-bold">Your Quizzes</h2>
										<p className="text-sm text-muted-foreground">Custom quizzes you've created</p>
									</div>
								</div>
								<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
									{customQuizzes.map((quiz, index) => (
										<motion.div
											key={quiz.id}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: index * 0.08 }}
										>
											<Card
												onClick={() => setSelectedQuiz(quiz)}
												className={cn(
													'group flex h-full cursor-pointer flex-col rounded-2xl border-2 transition-all duration-300',
													'hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10',
													startingQuizId === quiz.id
														? 'border-quiz-orange bg-gradient-to-br from-quiz-orange/5 to-quiz-gold/5 shadow-lg shadow-quiz-orange/10'
														: 'border-transparent hover:border-blue-500/30',
												)}
											>
												<CardHeader className="pb-3">
													<div className="flex items-start justify-between">
														<CardTitle className="line-clamp-2 text-xl transition-colors group-hover:text-quiz-orange">
															{quiz.title}
														</CardTitle>
													</div>
												</CardHeader>
												<CardContent className="flex flex-1 flex-col justify-between pt-0">
													<div className="flex items-center gap-1.5 text-sm text-muted-foreground">
														<HelpCircle className="h-4 w-4" />
														<span>{quiz.questions.length} questions</span>
													</div>
													<div className="mt-2 flex items-center justify-end gap-1">
														{startingQuizId === quiz.id ? (
															<Loader2 className="h-4 w-4 animate-spin text-quiz-orange" />
														) : (
															<div className="flex items-center gap-1 opacity-0 transition-opacity group-hover-always:opacity-100">
																<Button
																	variant="ghost"
																	size="icon"
																	className="h-7 w-7"
																	onClick={(event) => {
																		event.stopPropagation();
																		navigate(`/edit/${quiz.id}`);
																	}}
																>
																	<Pencil className="h-3.5 w-3.5" />
																</Button>
																<Button
																	variant="ghost"
																	size="icon"
																	className="h-7 w-7 text-red-500 hover:text-red-700"
																	onClick={(event) => {
																		event.stopPropagation();
																		setQuizToDelete(quiz.id);
																	}}
																>
																	<Trash2 className="h-3.5 w-3.5" />
																</Button>
															</div>
														)}
													</div>
												</CardContent>
											</Card>
										</motion.div>
									))}
									{/* Create New Quiz Card */}
									<motion.div
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: (customQuizzes.length + 1) * 0.08 }}
									>
										<Card
											onClick={() => navigate('/edit')}
											className="group h-full cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 transition-all duration-300 hover:-translate-y-1 hover:border-blue-400 hover:shadow-xl"
										>
											<CardHeader className="pb-3">
												<div className="flex items-start justify-between">
													<CardTitle className="text-xl text-slate-500 transition-colors group-hover:text-blue-600">
														Create New Quiz
													</CardTitle>
													<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 transition-colors group-hover:bg-blue-100">
														<PlusCircle className="h-5 w-5 text-slate-400 transition-colors group-hover:text-blue-500" />
													</div>
												</div>
											</CardHeader>
											<CardContent className="pt-0">
												<p className="text-sm text-muted-foreground">Build your own quiz from scratch</p>
											</CardContent>
										</Card>
									</motion.div>

									{/* Generate with AI Card / AI Generating Card */}
									{isGenerating ? (
										<motion.div
											ref={generatingCardReference}
											key="generating"
											initial={{ opacity: 0, scale: 0.9 }}
											animate={{ opacity: 1, scale: 1 }}
											transition={{
												opacity: { duration: 0.3 },
												scale: { type: 'spring', stiffness: 300, damping: 25 },
											}}
											className="relative rounded-2xl p-[2px]"
											style={{
												background: 'linear-gradient(90deg, #f97316, #fbbf24, #a3e635, #22d3d1, #818cf8, #e879f9, #fb7185, #f97316)',
												backgroundSize: '400% 100%',
												animation: 'border-beam 4s linear infinite',
											}}
										>
											{/* Ambient glow */}
											<div className="pointer-events-none absolute -inset-2 rounded-3xl bg-quiz-orange/15 blur-xl" />
											<Card className="relative h-full rounded-[14px] border-0 bg-white">
												<CardHeader className="pb-3">
													<div className="flex items-start justify-between">
														<CardTitle className="line-clamp-2 text-xl text-quiz-orange">{generatingPrompt}</CardTitle>
														<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-quiz-orange/10">
															<Sparkles className="h-5 w-5 animate-pulse text-quiz-orange" />
														</div>
													</div>
												</CardHeader>
												<CardContent className="pt-0">
													<div className="flex items-center gap-2 text-sm text-muted-foreground">
														<Loader2 className="h-4 w-4 shrink-0 animate-spin text-quiz-orange" />
														<span className="truncate">{getStatusMessage(generationStatus)}</span>
													</div>
												</CardContent>
											</Card>
										</motion.div>
									) : (
										<motion.div
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: (customQuizzes.length + 2) * 0.08 }}
										>
											<Dialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen}>
												<DialogTrigger asChild>
													<Card className="group h-full cursor-pointer rounded-2xl border-2 border-dashed border-quiz-orange/40 bg-gradient-to-br from-quiz-orange/5 to-quiz-gold/5 transition-all duration-300 hover:-translate-y-1 hover:border-quiz-orange hover:shadow-xl hover:shadow-quiz-orange/10">
														<CardHeader className="pb-3">
															<div className="flex items-start justify-between">
																<CardTitle className="text-xl text-quiz-orange">Generate with AI</CardTitle>
																<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-quiz-orange/10 transition-colors group-hover:bg-quiz-orange/20">
																	<Wand2 className="h-5 w-5 text-quiz-orange" />
																</div>
															</div>
														</CardHeader>
														<CardContent className="pt-0">
															<p className="text-sm text-muted-foreground">Let AI create questions for any topic</p>
														</CardContent>
													</Card>
												</DialogTrigger>
												<DialogContent className="sm:max-w-[425px]">
													<DialogHeader>
														<DialogTitle className="flex items-center gap-2">
															<Wand2 className="h-5 w-5 text-quiz-orange" />
															Generate Quiz with AI
														</DialogTitle>
														<DialogDescription>
															Describe the topic or theme for your quiz and AI will create engaging questions for you.
														</DialogDescription>
													</DialogHeader>
													<div className="grid gap-4 py-4">
														<div className="grid gap-2">
															<Label htmlFor="ai-prompt">Topic or Prompt</Label>
															<Input
																id="ai-prompt"
																placeholder="JavaScript basics, Famous artists, Holiday movies..."
																value={aiPrompt}
																onChange={(event) => setAiPrompt(event.target.value)}
																onKeyDown={(event) => event.key === 'Enter' && handleGenerateAiQuiz()}
																className="col-span-3"
																maxLength={LIMITS.AI_PROMPT_MAX}
															/>
															<p className="mt-1 text-xs text-muted-foreground">
																{aiPrompt.length}/{LIMITS.AI_PROMPT_MAX} characters
															</p>
														</div>
														<TurnstileWidget className="flex justify-center" />
													</div>
													<DialogFooter>
														<Button
															onClick={handleGenerateAiQuiz}
															disabled={aiPrompt.trim().length < LIMITS.AI_PROMPT_MIN || !turnstileToken}
															className="bg-quiz-orange hover:bg-quiz-orange/90"
														>
															<Wand2 className="mr-2 h-4 w-4" />
															Generate Quiz
														</Button>
													</DialogFooter>
												</DialogContent>
											</Dialog>
										</motion.div>
									)}
								</div>
							</section>
						</div>
					)}
				</div>
			</main>

			{/* Footer */}
			<footer className="relative z-10 border-t border-slate-200/50 py-6 text-center text-muted-foreground/80">
				<div className="mt-2 flex items-center justify-center gap-4">
					<a
						href="https://github.com/TimoWilhelm/timoot"
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/60 transition-colors hover:text-quiz-orange"
					>
						<img src="/icons/github-mark.svg" alt="GitHub" className="h-3 w-3 opacity-60" />
						Open Source
					</a>
					<button
						onClick={() => setIsMusicCreditsOpen(true)}
						className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/60 transition-colors hover:text-quiz-orange"
					>
						<Music className="h-3 w-3" />
						Music Credits
					</button>
					<button
						onClick={() => {
							setSyncCode(undefined);
							setSyncCodeInput('');
							setIsSyncDialogOpen(true);
						}}
						className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/60 transition-colors hover:text-quiz-orange"
					>
						<RefreshCw className="h-3 w-3" />
						Sync Devices
					</button>
				</div>
			</footer>

			{/* Start Quiz Confirmation Dialog */}
			<Dialog open={!!selectedQuiz} onOpenChange={(open) => !open && !isGameStarting && setSelectedQuiz(undefined)}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-2xl">
							<Sparkles className="h-6 w-6 text-quiz-orange" />
							{selectedQuiz?.title}
						</DialogTitle>
						<DialogDescription>Ready to start the game?</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="space-y-3 rounded-xl bg-slate-50 p-4">
							<div className="flex items-center gap-2 text-sm">
								<HelpCircle className="h-4 w-4 text-muted-foreground" />
								<span className="text-muted-foreground">Questions:</span>
								<span className="font-medium">{selectedQuiz?.questions.length}</span>
							</div>
						</div>
						<TurnstileWidget className="flex justify-center" />
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setSelectedQuiz(undefined)} disabled={isGameStarting}>
							Cancel
						</Button>
						<Button
							onClick={() => {
								if (selectedQuiz) {
									void handleStartGame(selectedQuiz.id);
								}
							}}
							disabled={isGameStarting || !turnstileToken}
							className="min-w-[130px] bg-quiz-orange hover:bg-quiz-orange/90"
						>
							{isGameStarting ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Starting...
								</>
							) : (
								<>
									<Gamepad2 className="mr-2 h-4 w-4" />
									Start Game
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Quiz Confirmation Dialog */}
			<AlertDialog open={!!quizToDelete} onOpenChange={(open) => !open && setQuizToDelete(undefined)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Quiz</AlertDialogTitle>
						<AlertDialogDescription>Are you sure you want to delete this quiz? This action cannot be undone.</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleDeleteQuiz} className="bg-red-500 hover:bg-red-600">
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Sync Devices Dialog */}
			<Dialog open={isSyncDialogOpen} onOpenChange={setIsSyncDialogOpen}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<RefreshCw className="h-5 w-5 text-quiz-orange" />
							Sync Devices
						</DialogTitle>
						<DialogDescription>Access your quizzes and images on another device</DialogDescription>
					</DialogHeader>
					<div className="space-y-6 py-4">
						{/* Generate Code Section */}
						<div className="space-y-3">
							<h4 className="font-medium">Share from this device</h4>
							{syncCode ? (
								<div className="space-y-2">
									<div className="flex items-center justify-center gap-2">
										<code className="rounded-lg bg-slate-100 px-4 py-3 font-mono text-2xl font-bold tracking-widest">{syncCode}</code>
										<Button variant="outline" size="icon" className="h-7 w-7" onClick={copyCodeToClipboard}>
											{codeCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
										</Button>
									</div>
									<p className="text-center text-xs text-muted-foreground">
										Expires in {Math.max(0, Math.ceil(((syncCodeExpiry || 0) - Date.now()) / 60_000))} minutes
									</p>
								</div>
							) : (
								<>
									<TurnstileWidget className="flex justify-center" />
									<Button onClick={handleGenerateSyncCode} disabled={isGeneratingSyncCode || !turnstileToken} className="w-full">
										{isGeneratingSyncCode ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
										Generate Sync Code
									</Button>
								</>
							)}
						</div>

						<div className="relative">
							<div className="absolute inset-0 flex items-center">
								<span className="w-full border-t" />
							</div>
							<div className="relative flex justify-center text-xs uppercase">
								<span className="bg-white px-2 text-muted-foreground">or</span>
							</div>
						</div>

						{/* Redeem Code Section */}
						<div className="space-y-3">
							<h4 className="font-medium">Sync to this device</h4>
							{showSyncWarning ? (
								<div className="space-y-3">
									<div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
										<p className="font-medium text-amber-800">
											Warning: You have {customQuizzes.length} custom quiz{customQuizzes.length === 1 ? '' : 'es'} on this device.
										</p>
										<p className="mt-1 text-amber-700">
											Syncing will switch to a different account and you'll lose access to your current quizzes and images.
										</p>
									</div>
									<div className="flex gap-2">
										<Button variant="outline" onClick={() => setShowSyncWarning(false)} className="flex-1">
											Cancel
										</Button>
										<Button
											onClick={() => handleRedeemSyncCode(true)}
											disabled={isRedeemingSyncCode}
											className="flex-1 bg-amber-500 hover:bg-amber-600"
										>
											{isRedeemingSyncCode ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sync Anyway'}
										</Button>
									</div>
								</div>
							) : (
								<>
									<div className="flex gap-2">
										<Input
											placeholder="Enter 6-digit code"
											value={syncCodeInput}
											onChange={(event) => setSyncCodeInput(event.target.value.toUpperCase().slice(0, 6))}
											maxLength={6}
											className="text-center font-mono text-lg tracking-widest"
											onKeyDown={(event) => event.key === 'Enter' && handleRedeemSyncCode()}
										/>
										<Button
											onClick={() => handleRedeemSyncCode()}
											disabled={isRedeemingSyncCode || syncCodeInput.length !== 6}
											className="bg-quiz-orange hover:bg-quiz-orange/90"
										>
											{isRedeemingSyncCode ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sync'}
											{isRedeemingSyncCode ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sync'}
										</Button>
									</div>
									<p className="text-xs text-muted-foreground">
										Enter a code from another device to access the same quizzes and images here.
									</p>
								</>
							)}
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Music Credits Dialog */}
			<Dialog open={isMusicCreditsOpen} onOpenChange={setIsMusicCreditsOpen}>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Music className="h-5 w-5 text-quiz-orange" />
							Music Credits
						</DialogTitle>
						<DialogDescription>Attribution for music used in this application</DialogDescription>
					</DialogHeader>
					<div className="max-h-[400px] space-y-4 overflow-y-auto py-4">
						{musicCredits.map((credit) => (
							<div key={credit.title} className="rounded-lg bg-slate-50 p-3">
								<p className="font-medium text-slate-900">
									"{credit.title}"{' '}
									<a href={credit.artistUrl} target="_blank" rel="noopener noreferrer" className="text-quiz-orange hover:underline">
										{credit.artist} ({new URL(credit.artistUrl).hostname})
									</a>
								</p>
								<p className="text-sm text-muted-foreground">
									Licensed under{' '}
									<a href={credit.licenseUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
										{credit.license}
									</a>
								</p>
							</div>
						))}
					</div>
				</DialogContent>
			</Dialog>

			<Toaster richColors closeButton />
		</div>
	);
}
