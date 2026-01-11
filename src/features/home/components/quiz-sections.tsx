import { use } from 'react';

import { CustomQuizzesSection, FeaturedQuizzesSection } from '@/features/home/components';

import type { Quiz } from '@shared/types';

interface QuizSectionsProperties {
	// Accept generic promise property from useQuery - the actual data is typed when consumed
	predefinedQuizQuery: { promise: Promise<unknown> };
	customQuizQuery: { promise: Promise<unknown> };
	startingQuizId: string | undefined;
	isGenerating: boolean;
	generatingPrompt: string | undefined;
	generationStatus: { stage: string; detail?: string } | undefined;
	generatingCardRef: (element: HTMLDivElement | null) => void;
	aiPrompt: string;
	isAiDialogOpen: boolean;
	turnstileToken: string | null | undefined;
	TurnstileWidget: React.ComponentType<{ className?: string }>;
	onAiPromptChange: (value: string) => void;
	onAiDialogOpenChange: (open: boolean) => void;
	onGenerateAiQuiz: () => void;
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
}: QuizSectionsProperties) {
	// Use React 19's use() hook to consume the query promises
	// This will suspend the component until the data is ready
	// Type assertions needed because useQuery().promise has complex internal types
	const predefinedQuizzes = use(predefinedQuizQuery.promise) as Quiz[];
	const customQuizzes = use(customQuizQuery.promise) as Quiz[];

	return (
		<div className="space-y-20">
			<FeaturedQuizzesSection quizzes={predefinedQuizzes} startingQuizId={startingQuizId} onSelectQuiz={onSelectQuiz} />

			<CustomQuizzesSection
				quizzes={customQuizzes}
				isGenerating={isGenerating}
				generatingPrompt={generatingPrompt}
				generationStatus={generationStatus}
				generatingCardRef={generatingCardRef}
				aiPrompt={aiPrompt}
				isAiDialogOpen={isAiDialogOpen}
				turnstileToken={turnstileToken}
				TurnstileWidget={TurnstileWidget}
				onAiPromptChange={onAiPromptChange}
				onAiDialogOpenChange={onAiDialogOpenChange}
				onGenerateAiQuiz={onGenerateAiQuiz}
				onSelectQuiz={onSelectQuiz}
				onEditQuiz={onEditQuiz}
				onDeleteQuiz={onDeleteQuiz}
			/>
		</div>
	);
}
