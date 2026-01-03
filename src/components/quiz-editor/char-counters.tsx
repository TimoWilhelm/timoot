import { Control, useWatch } from 'react-hook-form';

import { LIMITS, type QuizFormInput } from '@shared/validation';

export function TitleCharCount({ control }: { control: Control<QuizFormInput> }) {
	const value = useWatch({ control, name: 'title' });
	return (
		<span
			className={`
				pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-xs
				text-muted-foreground
			`}
		>
			{value?.length || 0}/{LIMITS.QUIZ_TITLE_MAX}
		</span>
	);
}

export function QuestionCharCount({ control, qIndex }: { control: Control<QuizFormInput>; qIndex: number }) {
	const value = useWatch({ control, name: `questions.${qIndex}.text` });
	return (
		<span
			className={`
				pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-xs
				text-muted-foreground
			`}
		>
			{value?.length || 0}/{LIMITS.QUESTION_TEXT_MAX}
		</span>
	);
}

export function OptionCharCount({ control, qIndex, oIndex }: { control: Control<QuizFormInput>; qIndex: number; oIndex: number }) {
	const value = useWatch({ control, name: `questions.${qIndex}.options.${oIndex}` });
	return (
		<span
			className={`
				pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-xs
				text-muted-foreground
			`}
		>
			{value?.length || 0}/{LIMITS.OPTION_TEXT_MAX}
		</span>
	);
}
