import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { HostEnd } from './host-end';

const meta = {
	title: 'Host/End',
	component: HostEnd,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [
		(Story) => (
			<div className="flex min-h-screen flex-col bg-slate-100">
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof HostEnd>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Intro: Story = {
	args: {
		leaderboard: [
			{ id: '1', name: 'Alice', score: 5000, rank: 1 },
			{ id: '2', name: 'Bob', score: 4800, rank: 2 },
			{ id: '3', name: 'Charlie', score: 4200, rank: 3 },
		],
		revealed: false,
	},
};

export const Revealed: Story = {
	args: {
		leaderboard: [
			{ id: '1', name: 'Alice', score: 5000, rank: 1 },
			{ id: '2', name: 'Bob', score: 4800, rank: 2 },
			{ id: '3', name: 'Charlie', score: 4200, rank: 3 },
		],
		revealed: true,
	},
	play: async ({ canvas, step }) => {
		await step('Verify podium winners are displayed', async () => {
			await expect(canvas.getByText('Alice')).toBeInTheDocument();
			await expect(canvas.getByText('Bob')).toBeInTheDocument();
			await expect(canvas.getByText('Charlie')).toBeInTheDocument();
		});
	},
};

export const TiedFirstPlace: Story = {
	args: {
		leaderboard: [
			{ id: '1', name: 'Alice', score: 5000, rank: 1 },
			{ id: '2', name: 'Bob', score: 5000, rank: 1 },
			{ id: '3', name: 'Charlie', score: 4200, rank: 3 },
		],
		revealed: true,
	},
};

export const TwoPlayers: Story = {
	args: {
		leaderboard: [
			{ id: '1', name: 'Alice', score: 5000, rank: 1 },
			{ id: '2', name: 'Bob', score: 4800, rank: 2 },
		],
		revealed: true,
	},
};

export const OnePlayer: Story = {
	args: {
		leaderboard: [{ id: '1', name: 'SoloChampion', score: 10_000, rank: 1 }],
		revealed: true,
	},
};

export const LongNames: Story = {
	args: {
		leaderboard: [
			{ id: '1', name: 'TheUltimateQuizMaster', score: 5000, rank: 1 },
			{ id: '2', name: '🏆 Champion 🏆', score: 4800, rank: 2 },
			{ id: '3', name: 'BronzeMedalist2024', score: 4200, rank: 3 },
		],
		revealed: true,
	},
};

export const HighScores: Story = {
	args: {
		leaderboard: [
			{ id: '1', name: 'Alice', score: 99_999, rank: 1 },
			{ id: '2', name: 'Bob', score: 88_888, rank: 2 },
			{ id: '3', name: 'Charlie', score: 77_777, rank: 3 },
		],
		revealed: true,
	},
};
