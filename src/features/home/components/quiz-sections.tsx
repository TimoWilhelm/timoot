import { use } from 'react';

import { CustomQuizzesSection, FeaturedQuizzesSection } from '@/features/home/components';

import type { Quiz } from '@shared/types';

interface QuizSectionsProperties {
	predefinedQuizQuery: { promise: Promise<Quiz[]> };
	customQuizQuery: { promise: Promise<Quiz[]> };
	startingQuizId: string | undefined;
	userId: string;
	turnstileToken: string | null | undefined;
	TurnstileWidget: React.ComponentType<{ className?: string }>;
	onResetTurnstile: () => void;
	onSelectQuiz: (quiz: Quiz) => void;
	onEditQuiz: (quizId: string) => void;
	onDeleteQuiz: (quizId: string) => void;
}

/**
 * Component that consumes quiz data promises with React's use() hook.
 * This component will suspend until both queries resolve.
 */
export function QuizSections({
	predefinedQuizQuery,
	customQuizQuery,
	startingQuizId,
	userId,
	turnstileToken,
	TurnstileWidget,
	onResetTurnstile,
	onSelectQuiz,
	onEditQuiz,
	onDeleteQuiz,
}: QuizSectionsProperties) {
	const predefinedQuizzes = use(predefinedQuizQuery.promise);
	const customQuizzes = use(customQuizQuery.promise);

	return (
		<div className="space-y-20">
			<FeaturedQuizzesSection quizzes={predefinedQuizzes} startingQuizId={startingQuizId} onSelectQuiz={onSelectQuiz} />

			<CustomQuizzesSection
				quizzes={customQuizzes}
				userId={userId}
				turnstileToken={turnstileToken}
				TurnstileWidget={TurnstileWidget}
				onResetTurnstile={onResetTurnstile}
				onSelectQuiz={onSelectQuiz}
				onEditQuiz={onEditQuiz}
				onDeleteQuiz={onDeleteQuiz}
			/>
		</div>
	);
}
