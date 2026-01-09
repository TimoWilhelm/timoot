import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

import { OptionCharCount, QuestionCharCount, TitleCharCount } from './char-counters';

import type { QuizFormInput } from '@shared/validation';

// Test wrapper that renders the char count component with proper form context
function TestTitleCharCount({ title = '' }: { title?: string }) {
	const methods = useForm<QuizFormInput>({
		defaultValues: {
			title,
			questions: [
				{
					text: '',
					options: [{ value: '' }, { value: '' }],
					correctAnswerIndex: '0',
				},
			],
		},
	});

	return <TitleCharCount control={methods.control} />;
}

function TestQuestionCharCount({ questionText = '' }: { questionText?: string }) {
	const methods = useForm<QuizFormInput>({
		defaultValues: {
			title: '',
			questions: [
				{
					text: questionText,
					options: [{ value: '' }, { value: '' }],
					correctAnswerIndex: '0',
				},
			],
		},
	});

	return <QuestionCharCount control={methods.control} qIndex={0} />;
}

function TestOptionCharCount({
	options = [{ value: '' }, { value: '' }],
	optionIndex = 0,
}: {
	options?: Array<{ value: string }>;
	optionIndex?: number;
}) {
	const methods = useForm<QuizFormInput>({
		defaultValues: {
			title: '',
			questions: [
				{
					text: '',
					options,
					correctAnswerIndex: '0',
				},
			],
		},
	});

	return <OptionCharCount control={methods.control} qIndex={0} oIndex={optionIndex} />;
}

describe('TitleCharCount', () => {
	it('shows 0/100 when title is empty', () => {
		render(<TestTitleCharCount />);
		expect(screen.getByText('0/100')).toBeInTheDocument();
	});

	it('shows correct count when title has content', () => {
		render(<TestTitleCharCount title="Hello World" />);
		expect(screen.getByText('11/100')).toBeInTheDocument();
	});
});

describe('QuestionCharCount', () => {
	it('shows 0/120 when question is empty', () => {
		render(<TestQuestionCharCount />);
		expect(screen.getByText('0/120')).toBeInTheDocument();
	});

	it('shows correct count when question has content', () => {
		render(<TestQuestionCharCount questionText="What is the capital of France?" />);
		expect(screen.getByText('30/120')).toBeInTheDocument();
	});
});

describe('OptionCharCount', () => {
	it('shows 0/75 when option is empty', () => {
		render(<TestOptionCharCount />);
		expect(screen.getByText('0/75')).toBeInTheDocument();
	});

	it('shows correct count when option has content', () => {
		render(<TestOptionCharCount options={[{ value: 'Paris' }, { value: 'London' }]} optionIndex={0} />);
		expect(screen.getByText('5/75')).toBeInTheDocument();
	});

	it('shows correct count for second option', () => {
		render(<TestOptionCharCount options={[{ value: 'Paris' }, { value: 'London' }]} optionIndex={1} />);
		expect(screen.getByText('6/75')).toBeInTheDocument();
	});
});
