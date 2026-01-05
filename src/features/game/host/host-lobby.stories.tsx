import { expect, fn } from 'storybook/test';

import { HostGameProvider } from '@/features/game/host/host-game-context';

import { HostLobby } from './host-lobby';
import { HostPageLayout } from './host-page-layout';

import type { WebSocketGameState } from '@/features/game/hooks/use-game-web-socket';
import type { Meta, StoryObj } from '@storybook/react-vite';

const mockGameState: WebSocketGameState = {
	phase: 'LOBBY',
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
	isDoublePoints: false,
	backgroundImage: undefined,
	answeredCount: 0,
	correctAnswerIndex: undefined,
	playerResult: undefined,
	answerCounts: [],
	leaderboard: [],
	isLastQuestion: false,
	endRevealed: false,
};

const meta = {
	title: 'Host/Lobby',
	component: HostLobby,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [
		(Story) => (
			<HostPageLayout>
				<Story />
			</HostPageLayout>
		),
	],
} satisfies Meta<typeof HostLobby>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
	decorators: [
		(Story) => (
			<HostGameProvider gameState={mockGameState} onStartGame={fn()} onNextState={fn()} onPlaySound={fn()} onPlayCountdownTick={fn()}>
				<Story />
			</HostGameProvider>
		),
	],
	play: async ({ canvas }) => {
		const startButton = canvas.getByRole('button', { name: /waiting for players/i });
		await expect(startButton).toBeDisabled();
	},
};

export const OnePlayer: Story = {
	decorators: [
		(Story) => (
			<HostGameProvider
				gameState={{
					...mockGameState,
					players: [{ id: '1', name: 'Alice' }],
				}}
				onStartGame={fn()}
				onNextState={fn()}
				onPlaySound={fn()}
				onPlayCountdownTick={fn()}
			>
				<Story />
			</HostGameProvider>
		),
	],
	play: async ({ canvas }) => {
		const startButton = canvas.getByRole('button', { name: /start game/i });
		await expect(startButton).toBeEnabled();
		// We can't easily test onStartGame call here because it's inside the provider created in the decorator
	},
};

export const FewPlayers: Story = {
	decorators: [
		(Story) => (
			<HostGameProvider
				gameState={{
					...mockGameState,
					players: [
						{ id: '1', name: 'Alice' },
						{ id: '2', name: 'Bob' },
						{ id: '3', name: 'Charlie' },
					],
				}}
				onStartGame={fn()}
				onNextState={fn()}
				onPlaySound={fn()}
				onPlayCountdownTick={fn()}
			>
				<Story />
			</HostGameProvider>
		),
	],
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
	decorators: [
		(Story) => (
			<HostGameProvider
				gameState={{
					...mockGameState,
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
				}}
				onStartGame={fn()}
				onNextState={fn()}
				onPlaySound={fn()}
				onPlayCountdownTick={fn()}
			>
				<Story />
			</HostGameProvider>
		),
	],
};

export const LongNames: Story = {
	decorators: [
		(Story) => (
			<HostGameProvider
				gameState={{
					...mockGameState,
					players: [
						{ id: '1', name: 'Alexander the Great' },
						{ id: '2', name: 'BobbyBobBobson123' },
						{ id: '3', name: '🎮 ProGamer2024 🎮' },
						{ id: '4', name: 'QuizMaster9000' },
					],
				}}
				onStartGame={fn()}
				onNextState={fn()}
				onPlaySound={fn()}
				onPlayCountdownTick={fn()}
			>
				<Story />
			</HostGameProvider>
		),
	],
};
