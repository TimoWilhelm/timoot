import { type RefObject } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, HelpCircle, Loader2, Pencil, Plus, Sparkles, Trash2, Wand2, Zap } from 'lucide-react';

import type { Quiz } from '@shared/types';
import { LIMITS } from '@shared/validation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface CustomQuizzesSectionProperties {
	quizzes: Quiz[];
	isGenerating: boolean;
	generatingPrompt: string | undefined;
	generationStatus: { stage: string; detail?: string } | undefined;
	generatingCardRef: RefObject<HTMLDivElement | null>;
	aiPrompt: string;
	isAiDialogOpen: boolean;
	turnstileToken: string | null;
	TurnstileWidget: React.ComponentType<{ className?: string }>;
	onAiPromptChange: (value: string) => void;
	onAiDialogOpenChange: (open: boolean) => void;
	onGenerateAiQuiz: () => void;
	onSelectQuiz: (quiz: Quiz) => void;
	onEditQuiz: (quizId: string) => void;
	onDeleteQuiz: (quizId: string) => void;
}

export function CustomQuizzesSection({
	quizzes,
	isGenerating,
	generatingPrompt,
	generationStatus,
	generatingCardRef,
	aiPrompt,
	isAiDialogOpen,
	turnstileToken,
	TurnstileWidget,
	onAiPromptChange,
	onAiDialogOpenChange,
	onGenerateAiQuiz,
	onSelectQuiz,
	onEditQuiz,
	onDeleteQuiz,
}: CustomQuizzesSectionProperties) {
	const navigate = useViewTransitionNavigate();

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
						variant="ghost"
						onClick={() => navigate('/edit')}
						className={`
							group relative size-full flex-col items-center justify-center gap-4
							overflow-hidden rounded-xl border-2 border-black p-6 text-center
							shadow-brutal-sm transition-all duration-200
							hover:-translate-y-px hover:bg-blue/10 hover:shadow-brutal
							active:translate-y-0 active:shadow-none
						`}
					>
						<div
							className="
								flex size-16 items-center justify-center rounded-full border-2
								border-black bg-blue shadow-brutal transition-transform
								group-hover:scale-110 group-hover:rotate-12
							"
						>
							<Plus className="size-8" strokeWidth={4} />
						</div>
						<h3 className="font-display text-2xl font-bold">Create New</h3>
					</Button>
				</motion.div>

				{isGenerating ? (
					<motion.div ref={generatingCardRef} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
						<div
							className={`
								relative flex size-full flex-col items-start justify-between
								overflow-hidden rounded-xl border-2 border-black bg-white p-6 text-left
								shadow-brutal-sm transition-all duration-200
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
								<h3 className="line-clamp-2 font-display text-xl leading-tight font-bold">Generating: {generatingPrompt ?? '...'}</h3>
								<p className="mt-1 font-mono text-sm text-muted-foreground">{getStatusMessage(generationStatus)}</p>
							</div>
						</div>
					</motion.div>
				) : (
					<motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white">
						<Dialog open={isAiDialogOpen} onOpenChange={onAiDialogOpenChange}>
							<DialogTrigger asChild>
								<Button
									type="button"
									variant="ghost"
									className={`
										group relative size-full flex-col items-center justify-center gap-4
										overflow-hidden rounded-xl border-2 border-black p-6 text-center
										shadow-brutal-sm transition-all duration-200
										hover:-translate-y-px hover:bg-purple/10 hover:shadow-brutal
										active:translate-y-0 active:shadow-none
									`}
								>
									<div
										className="
											flex size-16 items-center justify-center rounded-full border-2
											border-black bg-purple shadow-brutal transition-transform
											group-hover:scale-110 group-hover:-rotate-12
										"
									>
										<Wand2 className="size-8" strokeWidth={2.5} />
									</div>
									<h3 className="font-display text-2xl font-bold">Magic Quiz</h3>
								</Button>
							</DialogTrigger>
							<DialogContent className="overflow-hidden border-4 border-black p-0 sm:max-w-[425px]">
								<div className="bg-purple p-6">
									<DialogHeader>
										<DialogTitle
											className="
												flex items-center gap-3 font-display text-3xl font-bold text-black
												uppercase
											"
										>
											<Wand2 className="size-8" />
											Magic Quiz
										</DialogTitle>
										<DialogDescription className="text-black/70">Describe your topic and let AI do the heavy lifting.</DialogDescription>
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
											onChange={(event) => onAiPromptChange(event.target.value)}
											onKeyDown={(event) => event.key === 'Enter' && onGenerateAiQuiz()}
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
										onClick={onGenerateAiQuiz}
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
						<Button
							type="button"
							variant="ghost"
							onClick={() => onSelectQuiz(quiz)}
							className={`
								group relative size-full flex-col items-start justify-between
								overflow-hidden rounded-xl border-2 border-black p-6 shadow-brutal-sm
								transition-all duration-200
								hover:-translate-y-px hover:bg-pink/10 hover:shadow-brutal
								active:translate-y-0 active:shadow-none
							`}
						>
							<div className="mb-4 flex items-center justify-between">
								<div
									className="
										rounded-lg border-2 border-black bg-pink p-3 shadow-brutal-sm
										transition-transform
										group-hover:rotate-6
									"
								>
									<Zap className="size-6" fill="currentColor" />
								</div>
							</div>
							<h3 className="line-clamp-2 font-display text-xl leading-tight font-bold">{quiz.title}</h3>

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
						</Button>
					</motion.div>
				))}
			</div>
		</section>
	);
}
