import { useQueryClient } from '@tanstack/react-query';
import { BookOpen, HelpCircle, Loader2, Pencil, Plus, Sparkles, Trash2, Wand2, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/dialog';
import { Input } from '@/components/input';
import { Label } from '@/components/label';
import { useViewTransitionNavigate } from '@/hooks/ui/use-view-transition-navigate';
import { queryKeys } from '@/hooks/use-api';
import { hcWithType } from '@/lib/clients/api-client';
import { consumeSSEStream } from '@/lib/clients/sse-client';
import { aiPromptSchema, LIMITS, quizGenerateSSEEventSchema } from '@shared/validation';

import type { Quiz } from '@shared/types';

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

interface CustomQuizzesSectionProperties {
	quizzes: Quiz[];
	userId: string;
	turnstileToken: string | null | undefined;
	TurnstileWidget: React.ComponentType<{ className?: string }>;
	onResetTurnstile: () => void;
	onSelectQuiz: (quiz: Quiz) => void;
	onEditQuiz: (quizId: string) => void;
	onDeleteQuiz: (quizId: string) => void;
}

export function CustomQuizzesSection({
	quizzes,
	userId,
	turnstileToken,
	TurnstileWidget,
	onResetTurnstile,
	onSelectQuiz,
	onEditQuiz,
	onDeleteQuiz,
}: CustomQuizzesSectionProperties) {
	const navigate = useViewTransitionNavigate();
	const queryClient = useQueryClient();

	// AI generation state - all managed internally
	const [aiPrompt, setAiPrompt] = useState('');
	const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);
	const [generationStatus, setGenerationStatus] = useState<{ stage: string; detail?: string } | undefined>();
	const [generatingPrompt, setGeneratingPrompt] = useState<string | undefined>();
	const generatingCardReference = useRef<HTMLDivElement | null>(null);

	const isLimitReached = quizzes.length >= LIMITS.MAX_QUIZZES_PER_USER;

	const handleCreateClick = () => {
		if (isLimitReached) {
			toast.error(`You've reached the limit of ${LIMITS.MAX_QUIZZES_PER_USER} quizzes. Delete some to create more.`);
			return;
		}
		navigate('/edit');
	};

	const handleMagicQuizClick = () => {
		if (isLimitReached) {
			toast.error(`You've reached the limit of ${LIMITS.MAX_QUIZZES_PER_USER} quizzes. Delete some to create more.`);
			return;
		}
		setIsAiDialogOpen(true);
	};

	const handleGenerateAiQuiz = async () => {
		if (quizzes.length >= LIMITS.MAX_QUIZZES_PER_USER) {
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
		globalThis.setTimeout(() => {
			generatingCardReference.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}, 100);

		const client = hcWithType('/');
		try {
			const response = await client.api.quizzes.generate.$post({
				header: { 'x-user-id': userId, 'x-turnstile-token': turnstileToken },
				json: { prompt, numQuestions: 5 },
			});

			await consumeSSEStream(response, quizGenerateSSEEventSchema, {
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
			onResetTurnstile();
		} finally {
			setIsGenerating(false);
			setGenerationStatus(undefined);
			setGeneratingPrompt(undefined);
		}
	};

	return (
		<section>
			<div className="mb-8 flex items-end justify-between border-b-4 border-black pb-4">
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
				<motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white">
					<Button
						type="button"
						onClick={handleCreateClick}
						className={`
							group relative size-full flex-col items-center justify-center gap-4
							overflow-hidden rounded-xl p-6 text-center transition-all duration-75
							hover:bg-blue/10
							${isLimitReached ? 'opacity-50 grayscale' : ''}
						`}
					>
						<div
							className="
								flex size-16 items-center justify-center rounded-full border-2
								border-black bg-blue shadow-brutal transition-all duration-75
								group-hover:scale-110 group-hover:rotate-12
								group-active:translate-y-0.5 group-active:scale-95 group-active:rotate-0
								group-active:shadow-brutal-inset
							"
						>
							<Plus className="size-8" strokeWidth={4} />
						</div>
						<h3 className="font-display text-2xl font-bold">Create New</h3>
					</Button>
				</motion.div>

				{isGenerating ? (
					<motion.div ref={generatingCardReference} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
						<div
							className={`
								relative flex size-full flex-col items-start justify-between
								overflow-hidden rounded-xl border-2 border-black bg-white p-6 text-left
								shadow-brutal-sm transition-all duration-75
							`}
						>
							<motion.div
								aria-hidden="true"
								className="pointer-events-none absolute inset-0 opacity-25"
								style={{
									backgroundImage:
										'repeating-linear-gradient(45deg, rgba(0,0,0,0.18) 0, rgba(0,0,0,0.18) 6px, transparent 6px, transparent 14px)',
									backgroundSize: '40px 40px',
								}}
								animate={{ backgroundPosition: ['0px 0px', '80px 0px'] }}
								transition={{ duration: 1.2, ease: 'linear', repeat: Infinity }}
							/>
							<div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-white/20" />

							<div className="relative z-10 mb-4 flex w-full items-start justify-between">
								<div
									className="
										rounded-lg border-2 border-black bg-purple p-3 shadow-brutal-sm
									"
								>
									<Loader2 className="size-6 animate-spin text-white" />
								</div>
							</div>
							<div className="relative z-10 w-full">
								<h3 className="line-clamp-2 font-display text-xl/tight font-bold">Generating: {generatingPrompt ?? '...'}</h3>
								<p className="mt-1 font-mono text-sm text-muted-foreground">{getStatusMessage(generationStatus)}</p>
							</div>
						</div>
					</motion.div>
				) : (
					<motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white">
						<Button
							type="button"
							onClick={handleMagicQuizClick}
							className={`
								group relative size-full flex-col items-center justify-center gap-4
								overflow-hidden rounded-xl p-6 text-center transition-all duration-75
								hover:bg-purple/10
								${isLimitReached ? 'opacity-50 grayscale' : ''}
							`}
						>
							<div
								className="
									flex size-16 items-center justify-center rounded-full border-2
									border-black bg-purple shadow-brutal transition-all duration-75
									group-hover:scale-110 group-hover:-rotate-12
									group-active:translate-y-0.5 group-active:scale-95
									group-active:rotate-0 group-active:shadow-brutal-inset
								"
							>
								<Wand2 className="size-8" strokeWidth={2.5} />
							</div>
							<h3 className="font-display text-2xl font-bold">Magic Quiz</h3>
						</Button>

						<Dialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen}>
							<DialogContent className="overflow-hidden border-4 border-black p-0 sm:max-w-106.25">
								<div className="bg-purple p-6">
									<DialogHeader>
										<DialogTitle
											className="
												flex items-center justify-center gap-3 font-display text-3xl
												font-bold whitespace-nowrap text-black uppercase
												sm:justify-start
											"
										>
											<Wand2 className="size-8" />
											Magic Quiz
										</DialogTitle>
										<DialogDescription className="text-black/70">Generate a quiz from any topic.</DialogDescription>
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
											onKeyDown={(event) => {
												if (event.key === 'Enter') {
													void handleGenerateAiQuiz();
												}
											}}
											className={`
												rounded-lg border-2 border-black bg-white px-4 py-2 font-medium
												shadow-brutal-inset
												focus:ring-2 focus:ring-black focus:ring-offset-2
												focus:outline-hidden
											`}
											maxLength={LIMITS.AI_PROMPT_MAX}
										/>
										<p className="text-right text-xs font-bold text-muted-foreground">
											{aiPrompt.length}/{LIMITS.AI_PROMPT_MAX}
										</p>
									</div>
									<TurnstileWidget className="flex justify-center" />
									<Button
										onClick={() => void handleGenerateAiQuiz()}
										disabled={aiPrompt.trim().length < LIMITS.AI_PROMPT_MIN || !turnstileToken}
										variant="accent"
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
				)}

				{/* User Quizzes List */}
				{quizzes.map((quiz, index) => (
					<motion.div
						key={quiz.id}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: index * 0.05 }}
						className="bg-white"
					>
						<div
							role="button"
							tabIndex={0}
							onClick={() => onSelectQuiz(quiz)}
							onKeyDown={(event) => {
								if (event.key === 'Enter' || event.key === ' ') {
									event.preventDefault();
									onSelectQuiz(quiz);
								}
							}}
							className={`
								group relative flex size-full cursor-pointer flex-col items-start
								justify-between overflow-hidden rounded-xl border-2 border-black p-6
								shadow-brutal-sm transition-all duration-75
								hover:-translate-y-0.5 hover:bg-pink/10 hover:shadow-brutal
								active:translate-y-0.5 active:shadow-brutal-inset
							`}
						>
							<div className="mb-4 flex items-center justify-between">
								<div
									className="
										rounded-lg border-2 border-black bg-pink p-3 shadow-brutal-sm
										transition-all duration-75
										group-hover:rotate-6
										group-active:translate-y-0.5 group-active:rotate-0
										group-active:shadow-brutal-inset-sm
									"
								>
									<Zap className="size-6" fill="currentColor" />
								</div>
							</div>
							<h3
								className="
									line-clamp-2 font-display text-xl/tight font-bold whitespace-normal
								"
							>
								{quiz.title}
							</h3>

							<div className="flex w-full justify-between">
								<div
									className="
										flex items-center gap-2 text-sm font-bold text-muted-foreground
									"
								>
									<HelpCircle className="size-4" />
									{quiz.questions.length} Questions
								</div>

								<div
									className="
										flex gap-2 opacity-0 transition-opacity
										group-hover-always:opacity-100
									"
								>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={(event) => {
											event.stopPropagation();
											onEditQuiz(quiz.id);
										}}
										className="size-10"
									>
										<Pencil className="size-5.5" />
									</Button>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={(event) => {
											event.stopPropagation();
											onDeleteQuiz(quiz.id);
										}}
										className="size-10 text-red"
									>
										<Trash2 className="size-5.5" />
									</Button>
								</div>
							</div>
						</div>
					</motion.div>
				))}
			</div>
		</section>
	);
}
