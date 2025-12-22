import type { Meta, StoryObj } from '@storybook/react-vite';
import { PlayerAnswerScreen } from './PlayerAnswerScreen';
import { fn } from 'storybook/test';

const meta = {
	title: 'Player/AnswerScreen',
	component: PlayerAnswerScreen,
	parameters: {
		layout: 'fullscreen',
	},
	args: {
		onAnswer: fn(),
	},
	decorators: [
		(Story) => (
			<div className="flex min-h-screen items-center justify-center bg-slate-800 p-4">
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof PlayerAnswerScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FourOptions: Story = {
	args: {
		optionIndices: [0, 1, 2, 3],
		submittedAnswer: null,
	},
};

export const ThreeOptions: Story = {
	args: {
		optionIndices: [0, 1, 2],
		submittedAnswer: null,
	},
};

export const TwoOptions: Story = {
	args: {
		optionIndices: [0, 1],
		submittedAnswer: null,
	},
};

export const FirstSelected: Story = {
	args: {
		optionIndices: [0, 1, 2, 3],
		submittedAnswer: 0,
	},
};

export const SecondSelected: Story = {
	args: {
		optionIndices: [0, 1, 2, 3],
		submittedAnswer: 1,
	},
};

export const ThirdSelected: Story = {
	args: {
		optionIndices: [0, 1, 2, 3],
		submittedAnswer: 2,
	},
};

export const FourthSelected: Story = {
	args: {
		optionIndices: [0, 1, 2, 3],
		submittedAnswer: 3,
	},
};
