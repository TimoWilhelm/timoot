import type { Meta, StoryObj } from '@storybook/react-vite';
import { JoinGameDialog } from './join-game-dialog';

const meta = {
	title: 'Player/JoinGameDialog',
	component: JoinGameDialog,
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<typeof JoinGameDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
