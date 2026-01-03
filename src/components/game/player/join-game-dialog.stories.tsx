import type { Meta, StoryObj } from '@storybook/react-vite';
import { PlayerPageLayout } from './player-page-layout';
import { JoinGameDialog } from './join-game-dialog';

const meta = {
	title: 'Player/JoinGameDialog',
	component: JoinGameDialog,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [
		(Story) => (
			<PlayerPageLayout className="flex items-center justify-center">
				<Story />
			</PlayerPageLayout>
		),
	],
} satisfies Meta<typeof JoinGameDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
