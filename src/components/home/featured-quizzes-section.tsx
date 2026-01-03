import { motion } from 'framer-motion';
import { HelpCircle, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utilities';

import type { Quiz } from '@shared/types';

interface FeaturedQuizzesSectionProperties {
	quizzes: Quiz[];
	startingQuizId?: string;
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
							disabled={!!startingQuizId}
							onClick={() => onSelectQuiz(quiz)}
							className={cn(
								`
									group relative size-full flex-col items-start overflow-hidden
									rounded-xl border-2 border-black p-6 text-left shadow-brutal-sm
									transition-all duration-200
									hover:-translate-y-px hover:bg-yellow/10 hover:shadow-brutal
									active:translate-y-0 active:shadow-none
								`,
							)}
						>
							<div className="mb-4 flex w-full items-start justify-between">
								<div
									className="
										rounded-lg border-2 border-black bg-yellow p-3 shadow-brutal-sm
										transition-transform
										group-hover:rotate-6
									"
								>
									<Zap className="size-6 text-black" fill="currentColor" />
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
						</Button>
					</motion.div>
				))}
			</div>
		</section>
	);
}
