import type { Meta, StoryObj } from '@storybook/react-vite';
import { HostLobby } from './HostLobby';
import { fn } from 'storybook/test';

const meta = {
	title: 'Host/Lobby',
	component: HostLobby,
	parameters: {
		layout: 'fullscreen',
	},
	args: {
		onStart: fn(),
		gameId: 'ABC123',
	},
	decorators: [
		(Story) => (
			<div className="min-h-screen bg-slate-100">
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof HostLobby>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
	args: {
		players: [],
	},
};

export const OnePlayer: Story = {
	args: {
		players: [{ id: '1', name: 'Alice' }],
	},
};

export const FewPlayers: Story = {
	args: {
		players: [
			{ id: '1', name: 'Alice' },
			{ id: '2', name: 'Bob' },
			{ id: '3', name: 'Charlie' },
		],
	},
};

export const ManyPlayers: Story = {
	args: {
		players: [
			{ id: '1', name: 'Alice' },
			{ id: '2', name: 'Bob' },
			{ id: '3', name: 'Charlie' },
			{ id: '4', name: 'Diana' },
			{ id: '5', name: 'Eve' },
			{ id: '6', name: 'Frank' },
			{ id: '7', name: 'Grace' },
			{ id: '8', name: 'Henry' },
			{ id: '9', name: 'Ivy' },
			{ id: '10', name: 'Jack' },
			{ id: '11', name: 'Karen' },
			{ id: '12', name: 'Leo' },
		],
	},
};

export const LongNames: Story = {
	args: {
		players: [
			{ id: '1', name: 'Alexander the Great' },
			{ id: '2', name: 'BobbyBobBobson123' },
			{ id: '3', name: '🎮 ProGamer2024 🎮' },
			{ id: '4', name: 'QuizMaster9000' },
		],
	},
};
