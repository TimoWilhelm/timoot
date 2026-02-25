import { expect, fn } from 'storybook/test';

import { HostGameProvider } from '@/features/game/host/host-game-provider';

import { HostEnd } from './host-end';
import { HostPageLayout } from './host-page-layout';

import type { WebSocketGameState } from '@/features/game/hooks/use-game-web-socket';
import type { Meta, StoryObj } from '@storybook/react-vite';

const mockGameState: WebSocketGameState = {
	phase: 'END_REVEALED',
	phaseVersion: 0,
	gameId: 'ABC123',
	pin: 'ABC123',
	players: [],
	getReadyCountdownMs: 0,
	modifiers: [],
	questionIndex: 0,
	totalQuestions: 10,
	questionText: '',
	options: [],
	startTime: 0,
	timeLimitMs: 20_000,
	readingDurationMs: 0,
	isDoublePoints: false,
	backgroundImage: undefined,
	answeredCount: 0,
	correctAnswerIndex: undefined,
	playerResult: undefined,
	answerCounts: [],
	leaderboard: [],
	isLastQuestion: false,
	endRevealed: true,
};

const meta = {
	title: 'Host/End',
	component: HostEnd,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [
		(Story, { args }) => (
			<HostGameProvider
				isAdvancing={false}
				gameState={{
					...mockGameState,
					...args,
					endRevealed: (() => {
						if (typeof args === 'object' && args !== null) {
							const value = Reflect.get(args, 'revealed');
							if (typeof value === 'boolean') return value;
						}
						return mockGameState.endRevealed;
					})(),
				}}
				onStartGame={fn()}
				onNextState={fn()}
				onRemovePlayer={fn()}
				onPlaySound={fn()}
				onPlayCountdownTick={fn()}
			>
				<HostPageLayout>
					<Story />
				</HostPageLayout>
			</HostGameProvider>
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
