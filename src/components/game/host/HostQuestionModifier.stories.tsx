import type { Meta, StoryObj } from '@storybook/react-vite';
import { HostQuestionModifier } from './HostQuestionModifier';

const meta = {
	title: 'Host/QuestionModifier',
	component: HostQuestionModifier,
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<typeof HostQuestionModifier>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DoublePoints: Story = {
	args: {
		questionIndex: 2,
		totalQuestions: 10,
		modifiers: ['doublePoints'],
	},
};

export const NoModifiers: Story = {
	args: {
		questionIndex: 3,
		totalQuestions: 10,
		modifiers: [],
	},
};
