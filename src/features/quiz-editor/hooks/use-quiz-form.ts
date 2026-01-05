import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';

import { type QuizFormInput, quizFormSchema } from '@shared/validation';

export function useQuizForm() {
	const methods = useForm<QuizFormInput>({
		resolver: zodResolver(quizFormSchema),
		defaultValues: { title: '', questions: [] },
	});

	const { control } = methods;
	const fieldArray = useFieldArray({ control, name: 'questions' });

	return {
		methods,
		fieldArray,
	};
}
