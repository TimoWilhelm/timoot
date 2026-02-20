import { CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

import { Button } from '@/components/button';
import { useHostGameContext } from '@/features/game/host/host-game-context';
import { cn } from '@/lib/utilities';

export function HostReveal() {
	const { gameState, isAdvancing, onNextState: onNext } = useHostGameContext();
	const { questionText, options, correctAnswerIndex, answerCounts } = gameState;
	const totalAnswers = answerCounts.reduce((a, b) => a + b, 0);
	return (
		<div
			className={`
				flex grow flex-col items-center justify-center space-y-6 p-4
				sm:p-8
			`}
		>
			<h2
				className={`
					mb-4 text-center font-display text-3xl font-bold
					sm:text-5xl
				`}
			>
				{questionText}
			</h2>
			<div className="w-full max-w-4xl space-y-4">
				{options.map((option, index) => {
					const isCorrect = index === correctAnswerIndex;
					const count = answerCounts[index];
					const percentage = totalAnswers > 0 ? (count / totalAnswers) * 100 : 0;
					return (
						<motion.div
							key={index}
							initial={{ opacity: 0, x: -50 }}
							animate={{
								opacity: 1,
								x: 0,
								scale: isCorrect ? [1, 1.03, 1] : 1,
							}}
							transition={{
								delay: index * 0.2,
								...(isCorrect && {
									scale: {
										repeat: Infinity,
										duration: 1.5,
										ease: 'easeInOut',
									},
								}),
							}}
							className={cn(
								`
									relative overflow-hidden rounded-xl border-2 border-black p-4
									shadow-brutal
								`,
								isCorrect ? `border-4 border-green bg-green-light shadow-brutal-green` : 'bg-white',
							)}
						>
							<motion.div
								className={cn('absolute top-0 left-0 h-full', isCorrect ? `bg-green/20` : `bg-zinc/20`)}
								initial={{ width: 0 }}
								animate={{ width: `${percentage}%` }}
								transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
							/>
							<div
								className={`
									relative flex items-center justify-between gap-4 text-lg font-bold
									sm:text-2xl
								`}
							>
								<span className="flex items-center gap-2">
									<span>{option}</span>
									<CheckCircle className={cn('size-6 shrink-0', isCorrect ? `text-green-dark` : `invisible`)} />
								</span>
								<span
									className={`
										shrink-0 rounded-lg border-2 border-black bg-black px-3 py-1 font-mono
										text-white
									`}
								>
									{count}
								</span>
							</div>
						</motion.div>
					);
				})}
			</div>
			<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
				<Button
					data-host-next-button
					onClick={onNext}
					disabled={isAdvancing}
					variant="accent"
					size="lg"
					className="rounded-xl border-4 px-12 py-8 text-2xl font-black uppercase"
				>
					Next
				</Button>
			</motion.div>
		</div>
	);
}
