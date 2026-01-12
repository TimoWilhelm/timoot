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
	const moveUpButtonReferences = useRef<(HTMLButtonElement | null)[]>([]);
	const moveDownButtonReferences = useRef<(HTMLButtonElement | null)[]>([]);
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

		// Focus management: Follow the moved item to its new position
		// Use requestAnimationFrame to ensure DOM has updated
		requestAnimationFrame(() => {
			// Check if the same direction button is still available at the new position
			const isNowFirst = newIndex === 0;
			const isNowLast = newIndex === optionFields.length - 1;

			if (direction === 'up') {
				// Was moving up, now at newIndex
				if (isNowFirst) {
					// Can't move up anymore, focus the down button
					moveDownButtonReferences.current[newIndex]?.focus();
				} else {
					// Can still move up, focus the up button at new position
					moveUpButtonReferences.current[newIndex]?.focus();
				}
			} else {
				// Was moving down, now at newIndex
				if (isNowLast) {
					// Can't move down anymore, focus the up button
					moveUpButtonReferences.current[newIndex]?.focus();
				} else {
					// Can still move down, focus the down button at new position
					moveDownButtonReferences.current[newIndex]?.focus();
				}
			}
		});
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
						aria-label={`Move question ${index + 1} up`}
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
						aria-label={`Move question ${index + 1} down`}
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
								aria-label={`Delete question ${index + 1}`}
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
								aria-label={
									bgField.value ? `Change background image for question ${index + 1}` : `Add background image for question ${index + 1}`
								}
							>
								{bgField.value ? (
									<img src={bgField.value} alt="Background image preview" className={`absolute inset-0 size-full object-cover`} />
								) : (
									<span className="flex items-center gap-1.5" aria-hidden="true">
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
								variant={field.value ? 'accent' : 'subtle'}
								size="sm"
								onClick={() => field.onChange(!field.value)}
								aria-label="Double points"
								aria-pressed={field.value}
							>
								<Zap className={cn('size-4 shrink-0', field.value && 'fill-current')} aria-hidden="true" />
								<span className="whitespace-nowrap" aria-hidden="true">
									2× Points
								</span>
							</Button>
						)}
					/>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				<div>
					<Label htmlFor={`q${index}-text`}>Question Text</Label>
					<div className="relative">
						<Input
							{...register(`questions.${index}.text`)}
							id={`q${index}-text`}
							placeholder="What is...?"
							maxLength={LIMITS.QUESTION_TEXT_MAX}
							className="pr-16"
							aria-describedby={errors.questions?.[index]?.text ? `q${index}-text-error` : undefined}
						/>
						<QuestionCharCount control={control} qIndex={index} />
					</div>
					{errors.questions?.[index]?.text && (
						<p id={`q${index}-text-error`} className="mt-1 text-sm text-red" role="alert">
							{errors.questions[index]?.text?.message}
						</p>
					)}
				</div>
				<fieldset
					aria-describedby={
						errors.questions?.[index]?.options || errors.questions?.[index]?.correctAnswerIndex ? `q${index}-answers-error` : undefined
					}
				>
					<Label asChild>
						<legend id={`q${index}-answers-label`}>Answers</legend>
					</Label>
					{/*
						CSS Grid layout with RadioGroup component:
						- DOM order controls tab navigation: move buttons → RadioGroup → inputs → delete buttons
						- CSS Grid positions elements visually in rows via gridRow
						- RadioGroup uses display:contents so RadioGroupItems participate in parent grid
						- Proper screen reader semantics (single RadioGroup with all items)
						- No focus trap because move buttons are outside RadioGroup in DOM
					*/}
					<Controller
						control={control}
						name={`questions.${index}.correctAnswerIndex`}
						render={({ field: { onChange, value } }) => (
							<div
								className="mt-2 grid items-center gap-2"
								style={{
									gridTemplateColumns: 'auto auto 1fr auto',
									gridTemplateRows: `repeat(${optionFields.length}, auto)`,
								}}
							>
								{/* Column 1: Move buttons - rendered first in DOM for tab order */}
								{optionFields.map((field, oIndex) => (
									<div key={`move-${field.id}`} className="flex flex-col" style={{ gridColumn: 1, gridRow: oIndex + 1 }}>
										<Button
											ref={(element) => {
												moveUpButtonReferences.current[oIndex] = element;
											}}
											type="button"
											variant="ghost"
											size="icon"
											className="size-5 text-muted-foreground"
											onClick={() => handleMoveOption(oIndex, 'up')}
											disabled={oIndex === 0}
											aria-label={`Move option ${oIndex + 1} up`}
										>
											<ChevronUp className="size-3" />
										</Button>
										<Button
											ref={(element) => {
												moveDownButtonReferences.current[oIndex] = element;
											}}
											type="button"
											variant="ghost"
											size="icon"
											className="size-5 text-muted-foreground"
											onClick={() => handleMoveOption(oIndex, 'down')}
											disabled={oIndex === optionFields.length - 1}
											aria-label={`Move option ${oIndex + 1} down`}
										>
											<ChevronDown className="size-3" />
										</Button>
									</div>
								))}

								{/* Column 2: RadioGroup - spans all rows, uses flex internally for item positioning */}
								<RadioGroup
									onValueChange={onChange}
									value={String(value)}
									aria-labelledby={`q${index}-answers-label`}
									className="flex flex-col gap-y-2"
									style={{
										gridColumn: 2,
										gridRow: `1 / ${optionFields.length + 1}`,
									}}
								>
									{optionFields.map((field, oIndex) => (
										<div key={`radio-${field.id}`} className="flex h-10 items-center">
											<RadioGroupItem value={String(oIndex)} id={`q${index}o${oIndex}`} aria-describedby={`q${index}o${oIndex}-input`} />
										</div>
									))}
								</RadioGroup>

								{/* Column 3: Input fields */}
								{optionFields.map((field, oIndex) => (
									<div key={`input-${field.id}`} className="relative" style={{ gridColumn: 3, gridRow: oIndex + 1 }}>
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
											id={`q${index}o${oIndex}-input`}
											placeholder={`Option ${oIndex + 1}`}
											maxLength={LIMITS.OPTION_TEXT_MAX}
											className="pr-14"
											aria-label={`Answer option ${oIndex + 1} text`}
										/>
										<OptionCharCount control={control} qIndex={index} oIndex={oIndex} />
									</div>
								))}

								{/* Column 4: Delete buttons */}
								{optionFields.length > LIMITS.OPTIONS_MIN &&
									optionFields.map((field, oIndex) => (
										<Button
											key={`delete-${field.id}`}
											type="button"
											variant="ghost"
											size="icon"
											onClick={() => handleRemoveOption(oIndex)}
											className="
												text-muted-foreground
												hover:text-destructive
											"
											style={{ gridColumn: 4, gridRow: oIndex + 1 }}
											aria-label={`Delete option ${oIndex + 1}`}
										>
											<Trash2 className="size-4" />
										</Button>
									))}
							</div>
						)}
					/>
					{(errors.questions?.[index]?.options || errors.questions?.[index]?.correctAnswerIndex) && (
						<div id={`q${index}-answers-error`} role="alert" className="mt-1 space-y-1">
							{errors.questions?.[index]?.options && <p className="text-sm text-red">Each option must have text.</p>}
							{errors.questions?.[index]?.correctAnswerIndex && (
								<p className="text-sm text-red">{errors.questions[index]?.correctAnswerIndex?.message}</p>
							)}
						</div>
					)}
				</fieldset>
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
