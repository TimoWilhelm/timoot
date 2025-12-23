import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HostRevealProps {
	onNext: () => void;
	questionText: string;
	options: string[];
	correctAnswerIndex: number;
	answerCounts: number[];
}

export function HostReveal({ onNext, questionText, options, correctAnswerIndex, answerCounts }: HostRevealProps) {
	const totalAnswers = answerCounts.reduce((a, b) => a + b, 0);
	return (
		<div className="flex flex-grow flex-col items-center justify-center space-y-6 p-4 sm:p-8">
			<h2 className="mb-4 text-center text-3xl font-bold sm:text-5xl">{questionText}</h2>
			<div className="w-full max-w-4xl space-y-4">
				{options.map((option, i) => {
					const isCorrect = i === correctAnswerIndex;
					const count = answerCounts[i];
					const percentage = totalAnswers > 0 ? (count / totalAnswers) * 100 : 0;
					return (
						<motion.div
							key={i}
							initial={{ opacity: 0, x: -50 }}
							animate={{
								opacity: 1,
								x: 0,
								scale: isCorrect ? [1, 1.03, 1] : 1,
							}}
							transition={{
								delay: i * 0.2,
								...(isCorrect && {
									scale: {
										repeat: Infinity,
										duration: 1.5,
										ease: 'easeInOut',
									},
								}),
							}}
							className={`relative overflow-hidden rounded-lg p-4 shadow-md ${isCorrect ? 'border-2 border-green-500 bg-green-100' : 'bg-white'}`}
						>
							<motion.div
								className="absolute left-0 top-0 h-full bg-green-300/50"
								initial={{ width: 0 }}
								animate={{ width: `${percentage}%` }}
								transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
							/>
							<div className="relative flex items-center justify-between gap-4 text-lg font-bold sm:text-2xl">
								<span className="flex items-center gap-2">
									<span>{option}</span>
									<CheckCircle className={`h-6 w-6 flex-shrink-0 ${isCorrect ? 'text-green-600' : 'invisible'}`} />
								</span>
								<span className="flex-shrink-0">{count}</span>
							</div>
						</motion.div>
					);
				})}
			</div>
			<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
				<Button
					data-host-next-button
					onClick={onNext}
					size="lg"
					className="rounded-2xl bg-quiz-orange px-12 py-8 text-2xl font-bold text-white"
				>
					Next
				</Button>
			</motion.div>
		</div>
	);
}
