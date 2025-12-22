import type { Meta, StoryObj } from '@storybook/react-vite';
import { PlayerNicknameForm } from './PlayerNicknameForm';
import { fn } from 'storybook/test';

const meta = {
	title: 'Player/NicknameForm',
	component: PlayerNicknameForm,
	parameters: {
		layout: 'fullscreen',
	},
	args: {
		onJoin: fn(),
	},
} satisfies Meta<typeof PlayerNicknameForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		isLoading: false,
	},
};

export const Loading: Story = {
	args: {
		isLoading: true,
	},
};
