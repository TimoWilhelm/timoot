import { ChevronDown, ChevronUp, ImageIcon, PlusCircle, Trash2, Zap } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { UseFieldArrayMove, UseFieldArrayRemove, useFieldArray, useFormContext, Controller } from 'react-hook-form';

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
} from '@/components/alert-dialog/alert-dialog';
import { Button } from '@/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card/card';
import { Input } from '@/components/input/input';
import { Label } from '@/components/label/label';
import { RadioGroup, RadioGroupItem } from '@/components/radio-group/radio-group';
import { OptionCharCount, QuestionCharCount } from '@/features/quiz-editor/components/char-counters';
import { cn } from '@/lib/utilities';
import { LIMITS, type QuizFormInput } from '@shared/validation';

type QuizQuestionCardProperties = {
	index: number;
	id: string; // field.id
	move: UseFieldArrayMove;
	remove: UseFieldArrayRemove;
	isFirst: boolean;
	isLast: boolean;
	onOpenImageDialog: (index: number) => void;
};

export function QuizQuestionCard({ index, id, move, remove, isFirst, isLast, onOpenImageDialog }: QuizQuestionCardProperties) {
	const {
		register,
		control,
		getValues,
		setValue,
		formState: { errors },
	} = useFormContext<QuizFormInput>();

	// Nested useFieldArray for options - this allows append/remove without remounting all inputs
	const {
		fields: optionFields,
		append: appendOption,
		remove: removeOptionFromArray,
		move: moveOptionInArray,
	} = useFieldArray({
		control,
		name: `questions.${index}.options`,
	});

	const optionInputReferences = useRef<(HTMLInputElement | null)[]>([]);
	const shouldFocusNewOptionReference = useRef(false);

	const addOption = () => {
		if (optionFields.length < LIMITS.OPTIONS_MAX) {
			shouldFocusNewOptionReference.current = true;
			appendOption({ value: '' });
		}
	};

	const handleRemoveOption = (oIndex: number) => {
		if (optionFields.length > LIMITS.OPTIONS_MIN) {
			const currentCorrect = Number.parseInt(getValues(`questions.${index}.correctAnswerIndex`), 10);
			const newCorrect =
				currentCorrect === oIndex
					? 0 // If the deleted option was correct, default to the first option
					: currentCorrect > oIndex
						? currentCorrect - 1 // If a preceding option was deleted, shift index down
						: currentCorrect;

			removeOptionFromArray(oIndex);
			setValue(`questions.${index}.correctAnswerIndex`, String(newCorrect));
		}
	};

	const handleMoveOption = (oIndex: number, direction: 'up' | 'down') => {
		const newIndex = direction === 'up' ? oIndex - 1 : oIndex + 1;
		if (newIndex < 0 || newIndex >= optionFields.length) return;

		// Update correctAnswerIndex if the correct answer was moved
		const currentCorrect = Number.parseInt(getValues(`questions.${index}.correctAnswerIndex`), 10);
		let newCorrect = currentCorrect;
		if (currentCorrect === oIndex) {
			newCorrect = newIndex;
		} else if (currentCorrect === newIndex) {
			newCorrect = oIndex;
		}

		moveOptionInArray(oIndex, newIndex);
		setValue(`questions.${index}.correctAnswerIndex`, String(newCorrect));
	};

	// Focus the newly added option input
	useEffect(() => {
		if (shouldFocusNewOptionReference.current) {
			const lastIndex = optionFields.length - 1;
			optionInputReferences.current[lastIndex]?.focus();
			shouldFocusNewOptionReference.current = false;
		}
	}, [optionFields.length]);

	return (
		<Card key={id}>
			<CardHeader className="flex flex-row flex-wrap items-center gap-2">
				<CardTitle className="order-1">Question {index + 1}</CardTitle>
				<div
					className={`
						order-2 ml-auto flex items-center gap-1 border-l pl-2
						sm:order-3 sm:ml-0
					`}
				>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						onClick={() => move(index, index - 1)}
						disabled={isFirst}
						className="text-muted-foreground"
					>
						<ChevronUp className="size-5" />
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						onClick={() => move(index, index + 1)}
						disabled={isLast}
						className="text-muted-foreground"
					>
						<ChevronDown className="size-5" />
					</Button>
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className={`
									text-red
									hover:text-red
								`}
							>
								<Trash2 />
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Delete Question {index + 1}?</AlertDialogTitle>
								<AlertDialogDescription>
									You have unsaved changes. Are you sure you want to delete this question? Your changes will be lost.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction onClick={() => remove(index)} variant="danger">
									Delete
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
				<div
					className={`
						order-3 flex basis-full flex-wrap items-center gap-2
						sm:order-2 sm:ml-auto sm:basis-auto
					`}
				>
					<Controller
						control={control}
						name={`questions.${index}.backgroundImage`}
						render={({ field: bgField }) => (
							<Button
								type="button"
								variant="subtle"
								onClick={() => onOpenImageDialog(index)}
								className="relative h-8 w-20 overflow-hidden p-0"
							>
								{bgField.value ? (
									<img src={bgField.value} alt="" className={`absolute inset-0 size-full object-cover`} />
								) : (
									<span className="flex items-center gap-1.5">
										<ImageIcon className="size-4" />
										Image
									</span>
								)}
							</Button>
						)}
					/>
					<Controller
						control={control}
						name={`questions.${index}.isDoublePoints`}
						render={({ field }) => (
							<Button
								type="button"
								variant="subtle"
								size="sm"
								onClick={() => field.onChange(!field.value)}
								className={cn(field.value && 'bg-orange text-white')}
							>
								<Zap className={cn('size-4 shrink-0', field.value && 'fill-current')} />
								<span className="whitespace-nowrap">2× Points</span>
							</Button>
						)}
					/>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				<div>
					<Label>Question Text</Label>
					<div className="relative">
						<Input
							{...register(`questions.${index}.text`)}
							placeholder="What is...?"
							maxLength={LIMITS.QUESTION_TEXT_MAX}
							className="pr-16"
						/>
						<QuestionCharCount control={control} qIndex={index} />
					</div>
					{errors.questions?.[index]?.text && <p className="mt-1 text-sm text-red">{errors.questions[index]?.text?.message}</p>}
				</div>
				<div>
					<Label>Answers</Label>
					<Controller
						control={control}
						name={`questions.${index}.correctAnswerIndex`}
						render={({ field: { onChange, value } }) => (
							<RadioGroup onValueChange={onChange} value={String(value)} className={`mt-2 space-y-2`}>
								{optionFields.map((field, oIndex) => (
									<div key={field.id} className={`flex items-center gap-2`}>
										<div className="flex flex-col">
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="size-5 text-muted-foreground"
												onClick={() => handleMoveOption(oIndex, 'up')}
												disabled={oIndex === 0}
											>
												<ChevronUp className="size-3" />
											</Button>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="size-5 text-muted-foreground"
												onClick={() => handleMoveOption(oIndex, 'down')}
												disabled={oIndex === optionFields.length - 1}
											>
												<ChevronDown className="size-3" />
											</Button>
										</div>
										<RadioGroupItem value={String(oIndex)} id={`q${index}o${oIndex}`} />
										<div className="relative grow">
											<Input
												{...(() => {
													const { ref, ...rest } = register(`questions.${index}.options.${oIndex}.value`);
													return {
														...rest,
														ref: (element: HTMLInputElement | null) => {
															ref(element);
															optionInputReferences.current[oIndex] = element;
														},
													};
												})()}
												placeholder={`Option ${oIndex + 1}`}
												maxLength={LIMITS.OPTION_TEXT_MAX}
												className="pr-14"
											/>
											<OptionCharCount control={control} qIndex={index} oIndex={oIndex} />
										</div>
										{optionFields.length > LIMITS.OPTIONS_MIN && (
											<Button
												type="button"
												variant="ghost"
												size="icon"
												onClick={() => handleRemoveOption(oIndex)}
												className={`
													text-muted-foreground
													hover:text-destructive
												`}
											>
												<Trash2 className="size-4" />
											</Button>
										)}
									</div>
								))}
							</RadioGroup>
						)}
					/>
					{errors.questions?.[index]?.options && <p className={`mt-1 text-sm text-red`}>Each option must have text.</p>}
					{errors.questions?.[index]?.correctAnswerIndex && (
						<p className="mt-1 text-sm text-red">{errors.questions[index]?.correctAnswerIndex?.message}</p>
					)}
				</div>
				<div className="flex w-full justify-center">
					{optionFields.length < LIMITS.OPTIONS_MAX && (
						<Button type="button" variant="subtle" onClick={addOption}>
							<PlusCircle className="mr-2 size-4" /> Add Option
						</Button>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
