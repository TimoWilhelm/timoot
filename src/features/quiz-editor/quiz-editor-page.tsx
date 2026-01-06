import { ArrowLeft, Loader2, PlusCircle, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { FormProvider, SubmitHandler } from 'react-hook-form';
import { Link, useBlocker, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/alert-dialog/alert-dialog';
import { Button } from '@/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card/card';
import { GridBackground } from '@/components/grid-background/grid-background';
import { Input } from '@/components/input/input';
import { Label } from '@/components/label/label';
import { TitleCharCount } from '@/features/quiz-editor/components/char-counters';
import { ImageSelectionDialog } from '@/features/quiz-editor/components/image-selection-dialog';
import { QuizQuestionCard } from '@/features/quiz-editor/components/quiz-question-card';
import { useQuizForm } from '@/features/quiz-editor/hooks/use-quiz-form';
import { useViewTransitionNavigate } from '@/hooks/ui/use-view-transition-navigate';
import { useCreateQuiz, useCustomQuizzes, useGenerateQuestion, useQuizDetail, useUpdateQuiz } from '@/hooks/use-api';
import { useUserId } from '@/hooks/use-user-id';
import { LIMITS, type QuizFormInput } from '@shared/validation';

import type { Question } from '@shared/types';

type QuizFormData = {
	title: string;
	questions: Question[];
};

export function QuizEditorPage() {
	const { quizId } = useParams<{ quizId?: string }>();
	const navigate = useViewTransitionNavigate();
	const { userId } = useUserId();

	const { methods, fieldArray } = useQuizForm();
	const {
		control,
		handleSubmit,
		reset,
		getValues,
		setValue,
		formState: { errors, isSubmitting, isDirty },
	} = methods;
	const { fields, append, remove, move } = fieldArray;

	const [openImagePopover, setOpenImagePopover] = useState<number | undefined>();

	// React Query hooks
	const { data: customQuizzes = [] } = useCustomQuizzes(userId);
	const { data: quizData, isError: quizError } = useQuizDetail(userId, quizId);
	const createQuizMutation = useCreateQuiz();
	const updateQuizMutation = useUpdateQuiz();
	const generateQuestionMutation = useGenerateQuestion();

	const isGeneratingQuestion = generateQuestionMutation.isPending;

	// Track intentional navigation after save to skip the blocker
	const skipBlockerReference = useRef(false);

	// Block navigation when there are unsaved changes
	const blocker = useBlocker(() => isDirty && !skipBlockerReference.current);

	// Warn before browser/tab close when there are unsaved changes
	useEffect(() => {
		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			if (isDirty) {
				event.preventDefault();
			}
		};
		window.addEventListener('beforeunload', handleBeforeUnload);
		return () => window.removeEventListener('beforeunload', handleBeforeUnload);
	}, [isDirty]);

	// Reset form when quiz data is loaded or when creating new quiz
	useEffect(() => {
		if (quizId && quizData) {
			const formData: QuizFormInput = {
				...quizData,
				questions: quizData.questions.map((q) => ({
					...q,
					options: q.options.map((opt) => ({ value: opt })),
					correctAnswerIndex: String(q.correctAnswerIndex),
					backgroundImage: q.backgroundImage,
				})),
			};
			reset(formData);
		} else if (!quizId) {
			reset({
				title: '',
				questions: [
					{ text: '', options: [{ value: '' }, { value: '' }], correctAnswerIndex: '0', isDoublePoints: false, backgroundImage: undefined },
				],
			});
		}
	}, [quizId, quizData, reset]);

	// Handle quiz fetch error
	useEffect(() => {
		if (quizError) {
			toast.error('Could not load quiz for editing.');
			navigate('/edit');
		}
	}, [quizError, navigate]);

	const onSubmit: SubmitHandler<QuizFormInput> = async (data) => {
		const processedData: QuizFormData = {
			...data,
			questions: data.questions.map((q) => ({
				text: q.text,
				options: q.options.map((opt) => opt.value),
				correctAnswerIndex: Number.parseInt(q.correctAnswerIndex, 10),
				isDoublePoints: q.isDoublePoints,
				backgroundImage: q.backgroundImage,
			})),
		};

		const onSuccess = (result: { title: string } | undefined) => {
			toast.success(`Quiz "${result?.title}" saved successfully!`);
			reset(data);
			skipBlockerReference.current = true;
			navigate('/');
		};

		if (quizId) {
			updateQuizMutation.mutate(
				{ header: { 'x-user-id': userId }, param: { id: quizId }, json: { ...processedData, id: quizId } },
				{ onSuccess, onError: (error) => toast.error(error.message || 'Failed to save quiz') },
			);
		} else {
			if (customQuizzes.length >= LIMITS.MAX_QUIZZES_PER_USER) {
				toast.error(`You have reached the limit of ${LIMITS.MAX_QUIZZES_PER_USER} quizzes.`);
				return;
			}
			createQuizMutation.mutate(
				{ header: { 'x-user-id': userId }, json: processedData },
				{ onSuccess, onError: (error) => toast.error(error.message || 'Failed to save quiz') },
			);
		}
	};

	const addQuestion = () =>
		append({
			text: '',
			options: [{ value: '' }, { value: '' }],
			correctAnswerIndex: '0',
			isDoublePoints: false,
			backgroundImage: undefined,
		});

	const generateQuestion = () => {
		const title = getValues('title');
		if (!title.trim()) {
			toast.error('Please enter a quiz title first');
			return;
		}

		const currentQuestions = getValues('questions');
		if (currentQuestions.length >= LIMITS.QUESTIONS_MAX) {
			toast.error(`Cannot add more than ${LIMITS.QUESTIONS_MAX} questions`);
			return;
		}

		generateQuestionMutation.mutate(
			{
				header: { 'x-user-id': userId },
				json: {
					title,
					existingQuestions: currentQuestions.map((q) => ({
						text: q.text,
						options: q.options.map((opt) => opt.value),
						correctAnswerIndex: Number(q.correctAnswerIndex),
					})),
				},
			},
			{
				onSuccess: (data) => {
					append({
						text: data.text,
						options: data.options.map((opt) => ({ value: opt })),
						correctAnswerIndex: String(data.correctAnswerIndex),
						isDoublePoints: false,
					});
					toast.success('Question generated!');
				},
				onError: (error) => {
					toast.error(error.message || 'Failed to generate question');
				},
			},
		);
	};

	return (
		<div className="relative isolate min-h-screen bg-muted/50">
			<GridBackground className="-z-10" />
			<div
				className={`
					relative mx-auto max-w-4xl px-4 py-12
					sm:px-6
					lg:px-8
				`}
			>
				<FormProvider {...methods}>
					<form onSubmit={(event) => handleSubmit(onSubmit)(event)} className={`space-y-8`}>
						<div className="flex items-center gap-4">
							<Link to="/" viewTransition>
								<Button type="button" variant="subtle" size="icon" className="size-12">
									<ArrowLeft className="size-5" />
								</Button>
							</Link>
							<h1
								className={`
									font-display text-2xl font-bold
									sm:text-4xl
								`}
							>
								{quizId ? 'Edit Quiz' : 'Create a New Quiz'}
							</h1>
						</div>
						<Card>
							<CardHeader>
								<CardTitle>Quiz Details</CardTitle>
							</CardHeader>
							<CardContent>
								<Label htmlFor="title">Quiz Title</Label>
								<div className="relative">
									<Input
										id="title"
										{...methods.register('title')}
										placeholder="e.g., 'Fun Facts Friday'"
										className="pr-16 text-lg"
										maxLength={LIMITS.QUIZ_TITLE_MAX}
									/>
									<TitleCharCount control={control} />
								</div>
								{errors.title && <p className="mt-1 text-sm text-red">{errors.title.message}</p>}
							</CardContent>
						</Card>

						{fields.map((field, index) => (
							<QuizQuestionCard
								key={field.id}
								index={index}
								id={field.id}
								move={move}
								remove={remove}
								isFirst={index === 0}
								isLast={index === fields.length - 1}
								onOpenImageDialog={setOpenImagePopover}
							/>
						))}

						{fields.length < LIMITS.QUESTIONS_MAX && (
							<div
								className={`
									flex flex-col gap-4
									sm:flex-row
								`}
							>
								<Button
									type="button"
									variant="subtle"
									className="
										flex-1 py-4 text-base
										sm:py-8 sm:text-lg
									"
									onClick={addQuestion}
								>
									<PlusCircle className="mr-2 size-6" /> Add Question
								</Button>
								<Button
									type="button"
									variant="accent"
									onClick={generateQuestion}
									disabled={isGeneratingQuestion}
									className="
										flex-1 py-4 text-base
										sm:py-8 sm:text-lg
									"
								>
									{isGeneratingQuestion ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
									Generate Question
								</Button>
							</div>
						)}

						<div className="flex justify-end gap-4">
							<Link to="/" viewTransition>
								<Button type="button" variant="subtle">
									Cancel
								</Button>
							</Link>
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
								Save Quiz
							</Button>
						</div>
					</form>

					<ImageSelectionDialog
						open={openImagePopover !== undefined}
						onOpenChange={(open) => {
							if (!open) setOpenImagePopover(undefined);
						}}
						selectedImage={openImagePopover === undefined ? undefined : getValues(`questions.${openImagePopover}.backgroundImage`)}
						onSelectImage={(path) => {
							if (openImagePopover !== undefined) {
								setValue(`questions.${openImagePopover}.backgroundImage`, path, { shouldDirty: true });
							}
						}}
						userId={userId}
					/>
				</FormProvider>
			</div>

			<AlertDialog
				open={blocker.state === 'blocked'}
				onOpenChange={(open) => {
					if (!open && blocker.state === 'blocked') {
						blocker.reset();
					}
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
						<AlertDialogDescription>
							You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => blocker.reset?.()}>Stay</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								skipBlockerReference.current = true;
								blocker.proceed?.();
							}}
							variant="danger"
						>
							Leave
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
