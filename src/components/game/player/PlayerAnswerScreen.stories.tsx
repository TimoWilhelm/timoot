import type { Meta, StoryObj } from '@storybook/react-vite';
import { PlayerAnswerScreen } from './PlayerAnswerScreen';
import { fn, expect } from 'storybook/test';

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
	play: async ({ canvas }) => {
		const buttons = canvas.getAllByRole('button');
		await expect(buttons).toHaveLength(4);
		for (const button of buttons) {
			await expect(button).toBeEnabled();
		}
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
	play: async ({ canvas }) => {
		const buttons = canvas.getAllByRole('button');
		await expect(buttons).toHaveLength(2);
	},
};

export const ClickFirstOption: Story = {
	args: {
		optionIndices: [0, 1, 2, 3],
		submittedAnswer: null,
	},
	play: async ({ args, canvas, userEvent }) => {
		const buttons = canvas.getAllByRole('button');
		await userEvent.click(buttons[0]);
		await expect(args.onAnswer).toHaveBeenCalledWith(0);
	},
};

export const ClickSecondOption: Story = {
	args: {
		optionIndices: [0, 1, 2, 3],
		submittedAnswer: null,
	},
	play: async ({ args, canvas, userEvent }) => {
		const buttons = canvas.getAllByRole('button');
		await userEvent.click(buttons[1]);
		await expect(args.onAnswer).toHaveBeenCalledWith(1);
	},
};

export const FirstSelected: Story = {
	args: {
		optionIndices: [0, 1, 2, 3],
		submittedAnswer: 0,
	},
	play: async ({ canvas }) => {
		const buttons = canvas.getAllByRole('button');
		for (const button of buttons) {
			await expect(button).toBeDisabled();
		}
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
