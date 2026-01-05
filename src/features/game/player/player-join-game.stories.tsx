import { PlayerJoinGame } from './player-join-game';
import { PlayerPageLayout } from './player-page-layout';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
	title: 'Player/PlayerJoinGame',
	component: PlayerJoinGame,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [
		(Story) => (
			<PlayerPageLayout>
				<Story />
			</PlayerPageLayout>
		),
	],
} satisfies Meta<typeof PlayerJoinGame>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
