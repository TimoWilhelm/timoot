import type { Meta, StoryObj } from '@storybook/react-vite';
import { PlayerPageLayout } from './player-page-layout';
import { PlayerJoinGame } from './player-join-game';

const meta = {
	title: 'Player/PlayerJoinGame',
	component: PlayerJoinGame,
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
} satisfies Meta<typeof PlayerJoinGame>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
