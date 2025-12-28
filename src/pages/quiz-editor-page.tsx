import { useEffect, useRef, useState } from 'react';
import { Link, useBlocker, useNavigate, useParams } from 'react-router-dom';
import { Control, Controller, SubmitHandler, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
	ArrowLeft,
	ChevronDown,
	ChevronUp,
	ImageIcon,
	ImageOff,
	Loader2,
	PlusCircle,
	Save,
	Sparkles,
	Trash2,
	Wand2,
	X,
	Zap,
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import type { Question } from '@shared/types';
import { LIMITS, type QuizFormInput, quizFormSchema } from '@shared/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DEFAULT_BACKGROUND_IMAGES } from '@/lib/background-images';
import {
	useCreateQuiz,
	useDeleteImage,
	useGenerateImage,
	useGenerateQuestion,
	useImages,
	useLoadMoreImages,
	useQuizDetail,
	useUpdateQuiz,
} from '@/hooks/use-api';
import { useUserId } from '@/hooks/use-user-id';
import { useTurnstile } from '@/hooks/use-turnstile';

type QuizFormData = {
	title: string;
	questions: Question[];
};

function TitleCharCount({ control }: { control: Control<QuizFormInput> }) {
	const value = useWatch({ control, name: 'title' });
	return (
		<span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
			{value?.length || 0}/{LIMITS.QUIZ_TITLE_MAX}
		</span>
	);
}

function QuestionCharCount({ control, qIndex }: { control: Control<QuizFormInput>; qIndex: number }) {
	const value = useWatch({ control, name: `questions.${qIndex}.text` });
	return (
		<span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
			{value?.length || 0}/{LIMITS.QUESTION_TEXT_MAX}
		</span>
	);
}

function OptionCharCount({ control, qIndex, oIndex }: { control: Control<QuizFormInput>; qIndex: number; oIndex: number }) {
	const value = useWatch({ control, name: `questions.${qIndex}.options.${oIndex}` });
	return (
		<span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
			{value?.length || 0}/{LIMITS.OPTION_TEXT_MAX}
		</span>
	);
}

export function QuizEditorPage() {
	const { quizId } = useParams<{ quizId?: string }>();
	const navigate = useNavigate();
	const {
		register,
		control,
		handleSubmit,
		reset,
		getValues,
		formState: { errors, isSubmitting, isDirty },
	} = useForm<QuizFormInput>({
		resolver: zodResolver(quizFormSchema),
		defaultValues: { title: '', questions: [] },
	});
	const { fields, append, remove, update, move } = useFieldArray({ control, name: 'questions' });
	const [openImagePopover, setOpenImagePopover] = useState<number | undefined>();
	const [imageToDelete, setImageToDelete] = useState<string | undefined>();
	const [imagePrompt, setImagePrompt] = useState('');
	const turnstileReference = useRef<HTMLDivElement>(null);
	const { token: turnstileToken, resetToken, TurnstileWidget } = useTurnstile();
	const { userId } = useUserId();

	// React Query hooks
	const { data: imagesData } = useImages(userId);
	const { data: quizData, isError: quizError } = useQuizDetail(userId, quizId);
	const loadMoreImagesMutation = useLoadMoreImages();
	const createQuizMutation = useCreateQuiz();
	const updateQuizMutation = useUpdateQuiz();
	const generateQuestionMutation = useGenerateQuestion();
	const generateImageMutation = useGenerateImage();
	const deleteImageMutation = useDeleteImage();

	const aiImages = imagesData?.images ?? [];
	const aiImagesCursor = imagesData?.nextCursor;
	const isLoadingMoreImages = loadMoreImagesMutation.isPending;
	const isGeneratingQuestion = generateQuestionMutation.isPending;
	const isGeneratingImage = generateImageMutation.isPending;

	// Track intentional navigation after save to skip the blocker
	const skipBlockerReference = useRef(false);

	// Block navigation when there are unsaved changes (unless intentionally navigating after save)
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
					correctAnswerIndex: String(q.correctAnswerIndex),
					backgroundImage: q.backgroundImage,
				})),
			};
			reset(formData);
		} else if (!quizId) {
			reset({
				title: '',
				questions: [{ text: '', options: ['', ''], correctAnswerIndex: '0', isDoublePoints: false, backgroundImage: undefined }],
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

	const loadMoreImages = () => {
		if (!aiImagesCursor || isLoadingMoreImages) return;
		loadMoreImagesMutation.mutate({ userId, cursor: aiImagesCursor });
	};

	const onSubmit: SubmitHandler<QuizFormInput> = async (data) => {
		const processedData: QuizFormData = {
			...data,
			questions: data.questions.map((q) => ({
				text: q.text,
				options: q.options,
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
			createQuizMutation.mutate(
				{ header: { 'x-user-id': userId }, json: processedData },
				{ onSuccess, onError: (error) => toast.error(error.message || 'Failed to save quiz') },
			);
		}
	};

	const addQuestion = () =>
		append({ text: '', options: ['', ''], correctAnswerIndex: '0', isDoublePoints: false, backgroundImage: undefined });

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

		if (!turnstileToken) {
			toast.error('Please complete the captcha verification first');
			return;
		}

		resetToken();
		generateQuestionMutation.mutate(
			{
				header: { 'x-user-id': userId, 'x-turnstile-token': turnstileToken },
				json: {
					title,
					existingQuestions: currentQuestions.map((q) => ({
						text: q.text,
						options: q.options,
						correctAnswerIndex: Number(q.correctAnswerIndex),
					})),
				},
			},
			{
				onSuccess: (data) => {
					append({
						text: data.text,
						options: data.options,
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

	const deleteImage = (imageId: string) => {
		deleteImageMutation.mutate(
			{ userId, imageId },
			{
				onSuccess: () => {
					toast.success('Image deleted');
					setImageToDelete(undefined);
				},
				onError: (error) => toast.error(error.message || 'Failed to delete image'),
			},
		);
	};

	const generateImage = (onImageGenerated: (path: string) => void) => {
		if (!imagePrompt.trim()) {
			toast.error('Please enter a prompt for the image');
			return;
		}

		if (!turnstileToken) {
			turnstileReference.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
			toast.error('Please complete the captcha verification first');
			return;
		}

		resetToken();
		generateImageMutation.mutate(
			{ header: { 'x-user-id': userId, 'x-turnstile-token': turnstileToken }, json: { prompt: imagePrompt } },
			{
				onSuccess: (data) => {
					onImageGenerated(data.path);
					setImagePrompt('');
					setOpenImagePopover(undefined);
					toast.success('Image generated!');
				},
				onError: (error) => {
					toast.error(error.message || 'Failed to generate image');
				},
			},
		);
	};

	const addOption = (qIndex: number) => {
		const currentQuestion = getValues(`questions.${qIndex}`);
		if (currentQuestion.options.length < LIMITS.OPTIONS_MAX) {
			update(qIndex, {
				...currentQuestion,
				options: [...currentQuestion.options, ''],
			});
		}
	};
	const removeOption = (qIndex: number, oIndex: number) => {
		const currentQuestion = getValues(`questions.${qIndex}`);
		if (currentQuestion.options.length > LIMITS.OPTIONS_MIN) {
			const newOptions = currentQuestion.options.filter((_, index) => index !== oIndex);
			const currentCorrect = Number.parseInt(currentQuestion.correctAnswerIndex, 10);
			const newCorrect =
				currentCorrect === oIndex
					? 0 // If the deleted option was correct, default to the first option
					: currentCorrect > oIndex
						? currentCorrect - 1 // If a preceding option was deleted, shift index down
						: currentCorrect;
			update(qIndex, {
				...currentQuestion,
				options: newOptions,
				correctAnswerIndex: String(newCorrect),
			});
		}
	};
	const moveOption = (qIndex: number, oIndex: number, direction: 'up' | 'down') => {
		const currentQuestion = getValues(`questions.${qIndex}`);
		const newIndex = direction === 'up' ? oIndex - 1 : oIndex + 1;
		if (newIndex < 0 || newIndex >= currentQuestion.options.length) return;

		const newOptions = [...currentQuestion.options];
		[newOptions[oIndex], newOptions[newIndex]] = [newOptions[newIndex], newOptions[oIndex]];

		// Update correctAnswerIndex if the correct answer was moved
		const currentCorrect = Number.parseInt(currentQuestion.correctAnswerIndex, 10);
		let newCorrect = currentCorrect;
		if (currentCorrect === oIndex) {
			newCorrect = newIndex;
		} else if (currentCorrect === newIndex) {
			newCorrect = oIndex;
		}

		update(qIndex, {
			...currentQuestion,
			options: newOptions,
			correctAnswerIndex: String(newCorrect),
		});
	};
	return (
		<div className="min-h-screen bg-slate-50">
			<div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
				<form onSubmit={(event) => handleSubmit(onSubmit)(event)} className="space-y-8">
					<div className="flex items-center gap-4">
						<Link to="/">
							<Button type="button" variant="outline" size="icon">
								<ArrowLeft className="h-5 w-5" />
							</Button>
						</Link>
						<h1 className="font-display text-2xl font-bold sm:text-4xl">{quizId ? 'Edit Quiz' : 'Create a New Quiz'}</h1>
					</div>
					<Card className="rounded-2xl shadow-lg">
						<CardHeader>
							<CardTitle>Quiz Details</CardTitle>
						</CardHeader>
						<CardContent>
							<Label htmlFor="title">Quiz Title</Label>
							<div className="relative">
								<Input
									id="title"
									{...register('title')}
									placeholder="e.g., 'Fun Facts Friday'"
									className="pr-16 text-lg"
									maxLength={LIMITS.QUIZ_TITLE_MAX}
								/>
								<TitleCharCount control={control} />
							</div>
							{errors.title && <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>}
						</CardContent>
					</Card>
					{fields.map((field, qIndex) => (
						<Card key={field.id} className="rounded-2xl shadow-lg">
							<CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
								<CardTitle>Question {qIndex + 1}</CardTitle>
								<div className="flex items-center gap-2">
									<Controller
										control={control}
										name={`questions.${qIndex}.backgroundImage`}
										render={({ field: bgField }) => (
											<Popover open={openImagePopover === qIndex} onOpenChange={(open) => setOpenImagePopover(open ? qIndex : undefined)}>
												<PopoverTrigger asChild>
													<button
														type="button"
														className={`relative flex h-8 w-20 items-center justify-center overflow-hidden rounded-full text-sm font-semibold transition-all ${
															bgField.value ? 'shadow-md' : 'bg-muted text-muted-foreground hover:bg-muted/80'
														}`}
													>
														{bgField.value ? (
															<img src={bgField.value} alt="" className="absolute inset-0 h-full w-full object-cover" />
														) : (
															<span className="flex items-center gap-1.5">
																<ImageIcon className="h-4 w-4" />
																Image
															</span>
														)}
													</button>
												</PopoverTrigger>
												<PopoverContent className="w-[calc(100vw-2rem)] max-w-96 p-3" align="end">
													<div className="max-h-[70vh] space-y-4 overflow-y-auto">
														{/* Default Images */}
														<div className="space-y-2">
															<h4 className="text-sm font-semibold">Background Image</h4>
															<div className="grid grid-cols-2 gap-2">
																<button
																	type="button"
																	onClick={() => {
																		bgField.onChange('');
																		setOpenImagePopover(undefined);
																	}}
																	className={`relative flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-muted transition-all ${
																		bgField.value ? 'hover:ring-2 hover:ring-muted-foreground/30' : 'ring-2 ring-quiz-orange ring-offset-2'
																	}`}
																>
																	<div className="flex flex-col items-center gap-1 text-muted-foreground">
																		<ImageOff className="h-6 w-6" />
																		<span className="text-xs">No Image</span>
																	</div>
																</button>
																{DEFAULT_BACKGROUND_IMAGES.map((img) => (
																	<button
																		key={img.id}
																		type="button"
																		onClick={() => {
																			bgField.onChange(img.path);
																			setOpenImagePopover(undefined);
																		}}
																		className={`relative aspect-video overflow-hidden rounded-lg transition-all ${
																			bgField.value === img.path
																				? 'ring-2 ring-quiz-orange ring-offset-2'
																				: 'hover:ring-2 hover:ring-muted-foreground/30'
																		}`}
																	>
																		<img src={img.path} alt={img.name} className="h-full w-full object-cover" />
																	</button>
																))}
															</div>
														</div>

														{/* AI Generated Images */}
														{aiImages.length > 0 && (
															<div className="space-y-2">
																<h4 className="text-sm font-semibold text-muted-foreground">AI Generated</h4>
																<div className="grid grid-cols-2 gap-2">
																	{aiImages.map((img) => (
																		<div key={img.id} className="group relative">
																			<button
																				type="button"
																				onClick={() => {
																					bgField.onChange(img.path);
																					setOpenImagePopover(undefined);
																				}}
																				className={`relative aspect-video w-full overflow-hidden rounded-lg transition-all ${
																					bgField.value === img.path
																						? 'ring-2 ring-quiz-orange ring-offset-2'
																						: 'hover:ring-2 hover:ring-muted-foreground/30'
																				}`}
																				title={img.prompt}
																			>
																				<img src={img.path} alt={img.name} className="h-full w-full object-cover" />
																			</button>
																			<button
																				type="button"
																				onClick={(event) => {
																					event.stopPropagation();
																					setImageToDelete(img.id);
																				}}
																				className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity hover-never:bg-red-500 group-hover-always:opacity-100"
																				title="Delete image"
																			>
																				<X className="h-3 w-3" />
																			</button>
																		</div>
																	))}
																</div>
																{aiImagesCursor && (
																	<Button
																		type="button"
																		variant="outline"
																		size="sm"
																		className="w-full"
																		onClick={loadMoreImages}
																		disabled={isLoadingMoreImages}
																	>
																		{isLoadingMoreImages ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : undefined}
																		Load More
																	</Button>
																)}
															</div>
														)}

														{/* AI Image Generation */}
														<div className="space-y-2">
															<div className="flex items-center justify-between">
																<h4 className="flex items-center gap-1.5 text-sm font-semibold">
																	<Sparkles className="h-4 w-4 text-quiz-orange" />
																	Generate with AI
																</h4>
																<span className="flex items-center gap-1 text-[10px] text-muted-foreground">
																	Powered by
																	<img src="/icons/blackforestlabs.svg" alt="Black Forest Labs" className="h-3 w-3" />
																	FLUX.2 [dev]
																</span>
															</div>
															<div className="flex gap-2">
																<div className="relative flex-1">
																	<Input
																		placeholder="Describe the image..."
																		value={imagePrompt}
																		onChange={(event) => setImagePrompt(event.target.value)}
																		className="pr-14 text-sm"
																		maxLength={LIMITS.AI_IMAGE_PROMPT_MAX}
																		disabled={isGeneratingImage}
																		onKeyDown={(event) => {
																			if (event.key === 'Enter') {
																				event.preventDefault();
																				void generateImage(bgField.onChange);
																			}
																		}}
																	/>
																	<span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
																		{imagePrompt.length}/{LIMITS.AI_IMAGE_PROMPT_MAX}
																	</span>
																</div>
																<Button
																	type="button"
																	size="sm"
																	onClick={() => generateImage(bgField.onChange)}
																	disabled={isGeneratingImage || !imagePrompt.trim() || !turnstileToken}
																	className="shrink-0 bg-quiz-orange hover:bg-quiz-orange/90"
																>
																	{isGeneratingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
																</Button>
															</div>
														</div>
													</div>
												</PopoverContent>
											</Popover>
										)}
									/>
									<Controller
										control={control}
										name={`questions.${qIndex}.isDoublePoints`}
										render={({ field }) => (
											<button
												type="button"
												onClick={() => field.onChange(!field.value)}
												className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-all ${
													field.value
														? 'bg-gradient-to-r from-quiz-orange to-amber-500 text-white shadow-md'
														: 'bg-muted text-muted-foreground hover:bg-muted/80'
												}`}
											>
												<Zap className={`h-4 w-4 ${field.value ? 'fill-current' : ''}`} />
												2× Points
											</button>
										)}
									/>
									<div className="ml-1 flex items-center gap-1 border-l pl-2">
										<Button
											type="button"
											variant="ghost"
											size="icon"
											onClick={() => move(qIndex, qIndex - 1)}
											disabled={qIndex === 0}
											className="text-muted-foreground"
										>
											<ChevronUp className="h-5 w-5" />
										</Button>
										<Button
											type="button"
											variant="ghost"
											size="icon"
											onClick={() => move(qIndex, qIndex + 1)}
											disabled={qIndex === fields.length - 1}
											className="text-muted-foreground"
										>
											<ChevronDown className="h-5 w-5" />
										</Button>
										<AlertDialog>
											<AlertDialogTrigger asChild>
												<Button type="button" variant="ghost" size="icon" className="text-red-500 hover:text-red-700">
													<Trash2 />
												</Button>
											</AlertDialogTrigger>
											<AlertDialogContent>
												<AlertDialogHeader>
													<AlertDialogTitle>Delete Question {qIndex + 1}?</AlertDialogTitle>
													<AlertDialogDescription>
														You have unsaved changes. Are you sure you want to delete this question? Your changes will be lost.
													</AlertDialogDescription>
												</AlertDialogHeader>
												<AlertDialogFooter>
													<AlertDialogCancel>Cancel</AlertDialogCancel>
													<AlertDialogAction onClick={() => remove(qIndex)} className="bg-red-500 hover:bg-red-600">
														Delete
													</AlertDialogAction>
												</AlertDialogFooter>
											</AlertDialogContent>
										</AlertDialog>
									</div>
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<Label>Question Text</Label>
									<div className="relative">
										<Input
											{...register(`questions.${qIndex}.text`)}
											placeholder="What is...?"
											maxLength={LIMITS.QUESTION_TEXT_MAX}
											className="pr-16"
										/>
										<QuestionCharCount control={control} qIndex={qIndex} />
									</div>
									{errors.questions?.[qIndex]?.text && (
										<p className="mt-1 text-sm text-red-500">{errors.questions[qIndex]?.text?.message}</p>
									)}
								</div>
								<div>
									<Label>Answers</Label>
									<Controller
										control={control}
										name={`questions.${qIndex}.correctAnswerIndex`}
										render={({ field: { onChange, value } }) => (
											<RadioGroup onValueChange={onChange} value={String(value)} className="mt-2 space-y-2">
												{getValues(`questions.${qIndex}.options`).map((_, oIndex) => (
													<div key={`${field.id}-option-${oIndex}`} className="flex items-center gap-2">
														<div className="flex flex-col">
															<Button
																type="button"
																variant="ghost"
																size="icon"
																className="h-5 w-5 text-muted-foreground"
																onClick={() => moveOption(qIndex, oIndex, 'up')}
																disabled={oIndex === 0}
															>
																<ChevronUp className="h-3 w-3" />
															</Button>
															<Button
																type="button"
																variant="ghost"
																size="icon"
																className="h-5 w-5 text-muted-foreground"
																onClick={() => moveOption(qIndex, oIndex, 'down')}
																disabled={oIndex === getValues(`questions.${qIndex}.options`).length - 1}
															>
																<ChevronDown className="h-3 w-3" />
															</Button>
														</div>
														<RadioGroupItem value={String(oIndex)} id={`q${qIndex}o${oIndex}`} />
														<div className="relative flex-grow">
															<Input
																{...register(`questions.${qIndex}.options.${oIndex}`)}
																placeholder={`Option ${oIndex + 1}`}
																maxLength={LIMITS.OPTION_TEXT_MAX}
																className="pr-14"
															/>
															<OptionCharCount control={control} qIndex={qIndex} oIndex={oIndex} />
														</div>
														{getValues(`questions.${qIndex}.options`).length > LIMITS.OPTIONS_MIN && (
															<Button
																type="button"
																variant="ghost"
																size="icon"
																onClick={() => removeOption(qIndex, oIndex)}
																className="text-muted-foreground hover:text-destructive"
															>
																<Trash2 className="h-4 w-4" />
															</Button>
														)}
													</div>
												))}
											</RadioGroup>
										)}
									/>
									{errors.questions?.[qIndex]?.options && <p className="mt-1 text-sm text-red-500">Each option must have text.</p>}
									{errors.questions?.[qIndex]?.correctAnswerIndex && (
										<p className="mt-1 text-sm text-red-500">{errors.questions[qIndex]?.correctAnswerIndex?.message}</p>
									)}
								</div>
								{getValues(`questions.${qIndex}.options`).length < LIMITS.OPTIONS_MAX && (
									<Button type="button" variant="outline" onClick={() => addOption(qIndex)}>
										<PlusCircle className="mr-2 h-4 w-4" /> Add Option
									</Button>
								)}
							</CardContent>
						</Card>
					))}
					<div className="flex flex-col gap-3">
						<div className="flex gap-3">
							<Button type="button" onClick={addQuestion} variant="secondary" size="lg" className="flex-1">
								<PlusCircle className="mr-2 h-5 w-5" /> Add Question
							</Button>
							<Button
								type="button"
								onClick={generateQuestion}
								disabled={isGeneratingQuestion || !turnstileToken}
								variant="outline"
								size="lg"
								className="flex-1 border-quiz-orange/50 text-quiz-orange hover:bg-quiz-orange/10 hover:text-quiz-orange"
							>
								{isGeneratingQuestion ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Wand2 className="mr-2 h-5 w-5" />}
								Generate with AI
							</Button>
						</div>
						<div ref={turnstileReference} className="flex justify-center">
							<TurnstileWidget />
						</div>
					</div>
					<div className="flex items-center justify-end gap-4">
						<Button type="submit" disabled={isSubmitting} size="lg" className="bg-quiz-orange hover:bg-quiz-orange/90">
							{isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
							Save Quiz
						</Button>
					</div>
				</form>
			</div>
			<Toaster richColors />

			{/* Unsaved changes dialog */}
			<AlertDialog open={blocker.state === 'blocked'} preventBackClose>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
						<AlertDialogDescription>
							You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => blocker.reset?.()}>Stay on Page</AlertDialogCancel>
						<AlertDialogAction onClick={() => blocker.proceed?.()} className="bg-red-500 hover:bg-red-600">
							Leave Page
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Delete image confirmation dialog */}
			<AlertDialog open={!!imageToDelete} onOpenChange={(open) => !open && setImageToDelete(undefined)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Image?</AlertDialogTitle>
						<AlertDialogDescription>Are you sure you want to delete this image? This action cannot be undone.</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={() => imageToDelete && deleteImage(imageToDelete)} className="bg-red-500 hover:bg-red-600">
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
