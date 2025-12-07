import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm, useFieldArray, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import {
	PlusCircle,
	Trash2,
	Loader2,
	Save,
	ArrowLeft,
	ChevronUp,
	ChevronDown,
	Wand2,
	Zap,
	ImageIcon,
	ImageOff,
	Sparkles,
	X,
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import type { ApiResponse, Quiz, Question } from '@shared/types';
import { quizFormSchema, LIMITS, type QuizFormInput } from '@shared/validation';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DEFAULT_BACKGROUND_IMAGES } from '@/lib/background-images';

type QuizFormData = {
	title: string;
	questions: Question[];
};

type QuestionFormInput = QuizFormInput['questions'][number];

interface AIImage {
	id: string;
	name: string;
	path: string;
	prompt?: string;
	createdAt?: string;
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
		watch,
		formState: { errors, isSubmitting },
	} = useForm<QuizFormInput>({
		resolver: zodResolver(quizFormSchema),
		defaultValues: { title: '', questions: [] },
	});
	const { fields, append, remove, update, move } = useFieldArray({ control, name: 'questions' });
	const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
	const [openImagePopover, setOpenImagePopover] = useState<number | null>(null);
	const [aiImages, setAiImages] = useState<AIImage[]>([]);
	const [aiImagesCursor, setAiImagesCursor] = useState<string | undefined>(undefined);
	const [isLoadingMoreImages, setIsLoadingMoreImages] = useState(false);
	const [isGeneratingImage, setIsGeneratingImage] = useState(false);
	const [imagePrompt, setImagePrompt] = useState('');

	// Fetch AI-generated images on mount
	useEffect(() => {
		const fetchAiImages = async () => {
			try {
				const response = await fetch('/api/images');
				const result = (await response.json()) as ApiResponse<{ images: AIImage[]; nextCursor?: string }>;
				if (result.success && result.data) {
					setAiImages(result.data.images);
					setAiImagesCursor(result.data.nextCursor);
				}
			} catch (error) {
				console.error('Failed to fetch AI images:', error);
			}
		};
		fetchAiImages();
	}, []);

	const loadMoreImages = async () => {
		if (!aiImagesCursor || isLoadingMoreImages) return;
		setIsLoadingMoreImages(true);
		try {
			const response = await fetch(`/api/images?cursor=${encodeURIComponent(aiImagesCursor)}`);
			const result = (await response.json()) as ApiResponse<{ images: AIImage[]; nextCursor?: string }>;
			if (result.success && result.data) {
				setAiImages((prev) => [...prev, ...result.data!.images]);
				setAiImagesCursor(result.data.nextCursor);
			}
		} catch (error) {
			console.error('Failed to load more images:', error);
		} finally {
			setIsLoadingMoreImages(false);
		}
	};
	useEffect(() => {
		if (quizId) {
			const fetchQuiz = async () => {
				try {
					const response = await fetch(`/api/quizzes/custom/${quizId}`);
					const result = (await response.json()) as ApiResponse<Quiz>;
					if (result.success && result.data) {
						const formData: QuizFormInput = {
							...result.data,
							questions: result.data.questions.map((q) => ({
								...q,
								correctAnswerIndex: String(q.correctAnswerIndex),
								backgroundImage: q.backgroundImage,
							})),
						};
						reset(formData);
					} else {
						throw new Error(result.error || 'Failed to fetch quiz');
					}
				} catch (error) {
					toast.error('Could not load quiz for editing.');
					navigate('/edit');
				}
			};
			fetchQuiz();
		} else {
			reset({
				title: '',
				questions: [{ text: '', options: ['', ''], correctAnswerIndex: '0', isDoublePoints: false, backgroundImage: undefined }],
			});
		}
	}, [quizId, reset, navigate]);
	const onSubmit: SubmitHandler<QuizFormInput> = async (data) => {
		try {
			const processedData: QuizFormData = {
				...data,
				questions: data.questions.map((q) => ({
					text: q.text,
					options: q.options,
					correctAnswerIndex: parseInt(q.correctAnswerIndex, 10),
					isDoublePoints: q.isDoublePoints,
					backgroundImage: q.backgroundImage,
				})),
			};
			const url = quizId ? `/api/quizzes/custom/${quizId}` : '/api/quizzes/custom';
			const method = quizId ? 'PUT' : 'POST';
			const response = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...processedData, id: quizId }),
			});
			const result = (await response.json()) as ApiResponse<Quiz>;
			if (!response.ok || !result.success) {
				throw new Error(result.error || 'Failed to save quiz');
			}
			toast.success(`Quiz "${result.data?.title}" saved successfully!`);
			navigate('/');
		} catch (error) {
			if (error instanceof Error) {
				toast.error(error.message);
			} else {
				toast.error(String(error));
			}
		}
	};
	const addQuestion = () =>
		append({ text: '', options: ['', ''], correctAnswerIndex: '0', isDoublePoints: false, backgroundImage: undefined });

	const generateQuestion = async () => {
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

		setIsGeneratingQuestion(true);
		try {
			const response = await fetch('/api/quizzes/generate-question', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title,
					existingQuestions: currentQuestions.map((q) => ({
						text: q.text,
						options: q.options,
						correctAnswerIndex: Number(q.correctAnswerIndex),
					})),
				}),
			});

			const result = (await response.json()) as ApiResponse<Question>;
			if (!response.ok || !result.success || !result.data) {
				throw new Error(result.error || 'Failed to generate question');
			}

			append({
				text: result.data.text,
				options: result.data.options,
				correctAnswerIndex: String(result.data.correctAnswerIndex),
				isDoublePoints: false,
			});
			toast.success('Question generated!');
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to generate question');
		} finally {
			setIsGeneratingQuestion(false);
		}
	};

	const deleteImage = async (imageId: string, e: React.MouseEvent) => {
		e.stopPropagation();
		try {
			const response = await fetch(`/api/images/${imageId}`, { method: 'DELETE' });
			const result = (await response.json()) as ApiResponse<{ id: string }>;
			if (!response.ok || !result.success) {
				throw new Error(result.error || 'Failed to delete image');
			}
			setAiImages((prev) => prev.filter((img) => img.id !== imageId));
			toast.success('Image deleted');
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to delete image');
		}
	};

	const generateImage = async (onImageGenerated: (path: string) => void) => {
		if (!imagePrompt.trim()) {
			toast.error('Please enter a prompt for the image');
			return;
		}

		setIsGeneratingImage(true);
		try {
			const response = await fetch('/api/images/generate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ prompt: imagePrompt }),
			});

			const result = (await response.json()) as ApiResponse<AIImage>;
			if (!response.ok || !result.success || !result.data) {
				throw new Error(result.error || 'Failed to generate image');
			}

			// Add to AI images list
			setAiImages((prev) => [result.data!, ...prev]);
			// Set as the selected image
			onImageGenerated(result.data.path);
			setImagePrompt('');
			setOpenImagePopover(null);
			toast.success('Image generated!');
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to generate image');
		} finally {
			setIsGeneratingImage(false);
		}
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
			const newOptions = currentQuestion.options.filter((_, i) => i !== oIndex);
			const currentCorrect = parseInt(currentQuestion.correctAnswerIndex, 10);
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
		const currentCorrect = parseInt(currentQuestion.correctAnswerIndex, 10);
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
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<Link to="/">
								<Button type="button" variant="outline" size="icon">
									<ArrowLeft className="h-5 w-5" />
								</Button>
							</Link>
							<h1 className="font-display text-2xl font-bold sm:text-4xl">{quizId ? 'Edit Quiz' : 'Create a New Quiz'}</h1>
						</div>
						<Button type="submit" disabled={isSubmitting} size="lg" className="bg-quiz-orange hover:bg-quiz-orange/90">
							{isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
							Save Quiz
						</Button>
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
								<span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
									{watch('title')?.length || 0}/{LIMITS.QUIZ_TITLE_MAX}
								</span>
							</div>
							{errors.title && <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>}
						</CardContent>
					</Card>
					{fields.map((field, qIndex) => (
						<Card key={field.id} className="rounded-2xl shadow-lg">
							<CardHeader className="flex flex-row items-center justify-between">
								<CardTitle>Question {qIndex + 1}</CardTitle>
								<div className="flex items-center gap-2">
									<Controller
										control={control}
										name={`questions.${qIndex}.backgroundImage`}
										render={({ field: bgField }) => (
											<Popover open={openImagePopover === qIndex} onOpenChange={(open) => setOpenImagePopover(open ? qIndex : null)}>
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
												<PopoverContent className="w-96 p-3" align="end">
													<div className="max-h-[70vh] space-y-4">
														{/* Default Images */}
														<div className="space-y-2">
															<h4 className="text-sm font-semibold">Background Image</h4>
															<div className="grid grid-cols-2 gap-2">
																<button
																	type="button"
																	onClick={() => {
																		bgField.onChange('');
																		setOpenImagePopover(null);
																	}}
																	className={`relative flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-muted transition-all ${
																		!bgField.value ? 'ring-2 ring-quiz-orange ring-offset-2' : 'hover:ring-2 hover:ring-muted-foreground/30'
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
																			setOpenImagePopover(null);
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
																					setOpenImagePopover(null);
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
																				onClick={(e) => deleteImage(img.id, e)}
																				className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity hover:bg-red-500 group-hover:opacity-100"
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
																		{isLoadingMoreImages ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
																		Load More
																	</Button>
																)}
															</div>
														)}

														{/* AI Image Generation */}
														<div className="space-y-2">
															<h4 className="flex items-center gap-1.5 text-sm font-semibold">
																<Sparkles className="h-4 w-4 text-quiz-orange" />
																Generate with AI
															</h4>
															<div className="flex gap-2">
																<div className="relative flex-1">
																	<Input
																		placeholder="Describe the image..."
																		value={imagePrompt}
																		onChange={(e) => setImagePrompt(e.target.value)}
																		className="pr-14 text-sm"
																		maxLength={LIMITS.AI_IMAGE_PROMPT_MAX}
																		disabled={isGeneratingImage}
																		onKeyDown={(e) => {
																			if (e.key === 'Enter') {
																				e.preventDefault();
																				generateImage(bgField.onChange);
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
																	disabled={isGeneratingImage || !imagePrompt.trim()}
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
													<AlertDialogDescription>This will permanently remove this question and all its options.</AlertDialogDescription>
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
										<span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
											{watch(`questions.${qIndex}.text`)?.length || 0}/{LIMITS.QUESTION_TEXT_MAX}
										</span>
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
															<span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
																{watch(`questions.${qIndex}.options.${oIndex}`)?.length || 0}/{LIMITS.OPTION_TEXT_MAX}
															</span>
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
					<div className="flex gap-3">
						<Button type="button" onClick={addQuestion} variant="secondary" size="lg" className="flex-1">
							<PlusCircle className="mr-2 h-5 w-5" /> Add Question
						</Button>
						<Button
							type="button"
							onClick={generateQuestion}
							disabled={isGeneratingQuestion}
							variant="outline"
							size="lg"
							className="flex-1 border-quiz-orange/50 text-quiz-orange hover:bg-quiz-orange/10 hover:text-quiz-orange"
						>
							{isGeneratingQuestion ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Wand2 className="mr-2 h-5 w-5" />}
							Generate with AI
						</Button>
					</div>
				</form>
			</div>
			<Toaster richColors />
		</div>
	);
}
