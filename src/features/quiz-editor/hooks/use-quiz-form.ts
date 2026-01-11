import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';

import { type QuizFormInput, quizFormSchema } from '@shared/validation';

interface UseQuizFormOptions {
	defaultValues?: QuizFormInput;
}

export function useQuizForm(options?: UseQuizFormOptions) {
	const methods = useForm<QuizFormInput>({
		resolver: zodResolver(quizFormSchema),
		defaultValues: options?.defaultValues ?? { title: '', questions: [] },
	});

	const { control } = methods;
	const fieldArray = useFieldArray({ control, name: 'questions' });

	return {
		methods,
		fieldArray,
	};
}
