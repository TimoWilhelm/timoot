import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { HostLobby } from './HostLobby';

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
	play: async ({ canvas }) => {
		const startButton = canvas.getByRole('button', { name: /waiting for players/i });
		await expect(startButton).toBeDisabled();
	},
};

export const OnePlayer: Story = {
	args: {
		players: [{ id: '1', name: 'Alice' }],
	},
	play: async ({ args, canvas, userEvent }) => {
		const startButton = canvas.getByRole('button', { name: /start game/i });
		await expect(startButton).toBeEnabled();

		await userEvent.click(startButton);
		await expect(args.onStart).toHaveBeenCalled();
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
	play: async ({ canvas, step }) => {
		await step('Verify all players are displayed', async () => {
			await expect(canvas.getByText('Alice')).toBeInTheDocument();
			await expect(canvas.getByText('Bob')).toBeInTheDocument();
			await expect(canvas.getByText('Charlie')).toBeInTheDocument();
			await expect(canvas.getByText('Players (3)')).toBeInTheDocument();
		});

		await step('Verify copy link button exists', async () => {
			const copyButton = canvas.getByRole('button', { name: /copy link/i });
			await expect(copyButton).toBeInTheDocument();
		});
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
