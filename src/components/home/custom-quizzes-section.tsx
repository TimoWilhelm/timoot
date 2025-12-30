import { type RefObject } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, HelpCircle, Loader2, Pencil, Plus, Sparkles, Trash2, Wand2 } from 'lucide-react';
import { BRUTAL_CARD_BASE, BRUTAL_INPUT } from './styles';
import type { Quiz } from '@shared/types';
import { LIMITS } from '@shared/validation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utilities';
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
	startingQuizId: string | undefined;
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
	startingQuizId,
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
				<motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="order-first">
					<button
						type="button"
						onClick={() => navigate('/edit')}
						className={cn(
							BRUTAL_CARD_BASE,
							`
								group flex size-full cursor-pointer flex-col items-center justify-center
								gap-4 bg-gray-50 p-6 text-center
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
					<Dialog open={isAiDialogOpen} onOpenChange={onAiDialogOpenChange}>
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
						<DialogContent className="overflow-hidden border-4 border-black p-0 sm:max-w-[425px]">
							<div className="bg-purple-400 p-6">
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
										className={BRUTAL_INPUT}
										maxLength={LIMITS.AI_PROMPT_MAX}
									/>
									<p className="text-right text-xs font-bold text-gray-400">
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

				{/* Generating Card State */}
				{isGenerating && (
					<motion.div
						ref={generatingCardRef}
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						className="col-span-full"
					>
						<div
							className="
								relative overflow-hidden rounded-xl border-4 border-black bg-black p-1
								shadow-brutal-lg
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
				{quizzes.map((quiz, index) => (
					<motion.div key={quiz.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
						<button
							type="button"
							onClick={() => onSelectQuiz(quiz)}
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
												onEditQuiz(quiz.id);
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
												onDeleteQuiz(quiz.id);
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
								<h3 className="line-clamp-2 font-display text-xl leading-tight font-bold">{quiz.title}</h3>
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
	);
}
