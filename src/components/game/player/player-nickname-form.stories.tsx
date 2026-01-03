import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { PlayerPageLayout } from './player-page-layout';
import { PlayerNicknameForm } from './player-nickname-form';

const meta = {
	title: 'Player/NicknameForm',
	component: PlayerNicknameForm,
	parameters: {
		layout: 'fullscreen',
	},
	args: {
		onJoin: fn(),
	},
	decorators: [
		(Story) => (
			<PlayerPageLayout className="flex items-center justify-center">
				<Story />
			</PlayerPageLayout>
		),
	],
} satisfies Meta<typeof PlayerNicknameForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		isLoading: false,
	},
	play: async ({ canvas }) => {
		const submitButton = canvas.getByRole('button', { name: /join game/i });
		await expect(submitButton).toBeDisabled();
	},
};

export const Loading: Story = {
	args: {
		isLoading: true,
	},
	play: async ({ canvas }) => {
		const submitButton = canvas.getByRole('button', { name: /joining/i });
		await expect(submitButton).toBeDisabled();
	},
};

export const SubmitNickname: Story = {
	args: {
		isLoading: false,
	},
	play: async ({ args, canvas, userEvent, step }) => {
		const input = canvas.getByPlaceholderText(/your cool name/i);
		const submitButton = canvas.getByRole('button', { name: /join game/i });

		await step('Initially button is disabled', async () => {
			await expect(submitButton).toBeDisabled();
		});

		await step('Type a valid nickname', async () => {
			await userEvent.type(input, 'TestPlayer');
			await expect(input).toHaveValue('TestPlayer');
		});

		await step('Submit the form', async () => {
			await expect(submitButton).toBeEnabled();
			await userEvent.click(submitButton);
			await expect(args.onJoin).toHaveBeenCalledWith('TestPlayer');
		});
	},
};
