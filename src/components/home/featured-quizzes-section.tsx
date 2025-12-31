import { motion } from 'framer-motion';
import { HelpCircle, Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Quiz } from '@shared/types';
import { cn } from '@/lib/utilities';

interface FeaturedQuizzesSectionProperties {
	quizzes: Quiz[];
	startingQuizId: string | undefined;
	onSelectQuiz: (quiz: Quiz) => void;
}

export function FeaturedQuizzesSection({ quizzes, startingQuizId, onSelectQuiz }: FeaturedQuizzesSectionProperties) {
	return (
		<section>
			<div className="mb-8 flex items-end justify-between border-b-4 border-black pb-4">
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
				{quizzes.map((quiz, index) => (
					<motion.div key={quiz.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
						<Button
							type="button"
							variant="ghost"
							onClick={() => onSelectQuiz(quiz)}
							className={cn(
								`
									group relative size-full flex-col items-start overflow-hidden
									rounded-xl border-2 border-black bg-white p-6 text-left
									shadow-brutal-sm transition-all duration-200
									hover:-translate-y-px hover:bg-yellow/10 hover:shadow-brutal
									active:translate-y-0 active:shadow-none
								`,
								startingQuizId === quiz.id && 'bg-yellow/20 ring-2 ring-black ring-offset-2',
							)}
						>
							<div className="mb-4 flex w-full items-start justify-between">
								<div
									className="
										rounded-lg border-2 border-black bg-blue p-3 shadow-brutal-sm
										transition-transform
										group-hover:rotate-6
									"
								>
									<Zap className="size-6 text-white" fill="currentColor" />
								</div>
							</div>
							<h3 className="mb-2 font-display text-2xl leading-tight font-bold">{quiz.title}</h3>
							<div
								className="
									flex items-center gap-2 text-sm font-bold text-muted-foreground
								"
							>
								<HelpCircle className="size-4" />
								{quiz.questions.length} Questions
							</div>
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
						</Button>
					</motion.div>
				))}
			</div>
		</section>
	);
}
