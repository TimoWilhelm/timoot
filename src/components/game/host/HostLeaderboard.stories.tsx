import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { HostLeaderboard } from './HostLeaderboard';

const meta = {
	title: 'Host/Leaderboard',
	component: HostLeaderboard,
	parameters: {
		layout: 'fullscreen',
	},
	args: {
		onNext: fn(),
	},
	decorators: [
		(Story) => (
			<div className="flex min-h-screen flex-col bg-slate-100">
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof HostLeaderboard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TopFive: Story = {
	args: {
		leaderboard: [
			{ id: '1', name: 'Alice', score: 2500, rank: 1 },
			{ id: '2', name: 'Bob', score: 2200, rank: 2 },
			{ id: '3', name: 'Charlie', score: 1800, rank: 3 },
			{ id: '4', name: 'Diana', score: 1500, rank: 4 },
			{ id: '5', name: 'Eve', score: 1200, rank: 5 },
		],
		isLastQuestion: false,
	},
	play: async ({ canvas, step }) => {
		await step('Verify all players are displayed', async () => {
			await expect(canvas.getByText('Alice')).toBeInTheDocument();
			await expect(canvas.getByText('Bob')).toBeInTheDocument();
			await expect(canvas.getByText('Charlie')).toBeInTheDocument();
			await expect(canvas.getByText('Diana')).toBeInTheDocument();
			await expect(canvas.getByText('Eve')).toBeInTheDocument();
		});

		await step('Verify scores are displayed', async () => {
			await expect(canvas.getByText('2500')).toBeInTheDocument();
			await expect(canvas.getByText('2200')).toBeInTheDocument();
		});
	},
};

export const LastQuestion: Story = {
	args: {
		leaderboard: [
			{ id: '1', name: 'Alice', score: 5000, rank: 1 },
			{ id: '2', name: 'Bob', score: 4800, rank: 2 },
			{ id: '3', name: 'Charlie', score: 4200, rank: 3 },
			{ id: '4', name: 'Diana', score: 3800, rank: 4 },
			{ id: '5', name: 'Eve', score: 3500, rank: 5 },
		],
		isLastQuestion: true,
	},
};

export const WithRankChanges: Story = {
	args: {
		leaderboard: [
			{ id: '1', name: 'Bob', score: 2600, rank: 1, previousRank: 2 },
			{ id: '2', name: 'Alice', score: 2500, rank: 2, previousRank: 1 },
			{ id: '3', name: 'Eve', score: 2000, rank: 3, previousRank: 5 },
			{ id: '4', name: 'Charlie', score: 1800, rank: 4, previousRank: 3 },
			{ id: '5', name: 'Diana', score: 1500, rank: 5, previousRank: 4 },
		],
		isLastQuestion: false,
	},
};

export const NewEntryToTop5: Story = {
	args: {
		leaderboard: [
			{ id: '1', name: 'Alice', score: 2500, rank: 1, previousRank: 1 },
			{ id: '2', name: 'Bob', score: 2200, rank: 2, previousRank: 2 },
			{ id: '3', name: 'NewPlayer', score: 2000, rank: 3 },
			{ id: '4', name: 'Charlie', score: 1800, rank: 4, previousRank: 3 },
			{ id: '5', name: 'Diana', score: 1500, rank: 5, previousRank: 4 },
		],
		isLastQuestion: false,
	},
};

export const CloseScores: Story = {
	args: {
		leaderboard: [
			{ id: '1', name: 'Alice', score: 2500, rank: 1 },
			{ id: '2', name: 'Bob', score: 2490, rank: 2 },
			{ id: '3', name: 'Charlie', score: 2480, rank: 3 },
			{ id: '4', name: 'Diana', score: 2470, rank: 4 },
			{ id: '5', name: 'Eve', score: 2460, rank: 5 },
		],
		isLastQuestion: false,
	},
};

export const TwoPlayers: Story = {
	args: {
		leaderboard: [
			{ id: '1', name: 'Alice', score: 1500, rank: 1 },
			{ id: '2', name: 'Bob', score: 1200, rank: 2 },
		],
		isLastQuestion: false,
	},
};

export const OnePlayer: Story = {
	args: {
		leaderboard: [{ id: '1', name: 'SoloPlayer', score: 3000, rank: 1 }],
		isLastQuestion: true,
	},
};

export const LongNames: Story = {
	args: {
		leaderboard: [
			{ id: '1', name: 'SuperQuizMaster2024', score: 2500, rank: 1 },
			{ id: '2', name: '🎮 ProGamer 🎮', score: 2200, rank: 2 },
			{ id: '3', name: 'TheIncrediblePlayer', score: 1800, rank: 3 },
			{ id: '4', name: 'Bob', score: 1500, rank: 4 },
			{ id: '5', name: 'X', score: 1200, rank: 5 },
		],
		isLastQuestion: false,
	},
};
