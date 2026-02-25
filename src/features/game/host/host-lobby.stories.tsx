import { expect, fn, waitFor, within } from 'storybook/test';

import { HostGameProvider } from '@/features/game/host/host-game-provider';

import { HostLobby } from './host-lobby';
import { HostPageLayout } from './host-page-layout';

import type { WebSocketGameState } from '@/features/game/hooks/use-game-web-socket';
import type { Meta, StoryObj } from '@storybook/react-vite';

const mockGameState: WebSocketGameState = {
	phase: 'LOBBY',
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
			<HostGameProvider
				isAdvancing={false}
				gameState={mockGameState}
				onStartGame={fn()}
				onNextState={fn()}
				onRemovePlayer={fn()}
				onPlaySound={fn()}
				onPlayCountdownTick={fn()}
			>
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
				isAdvancing={false}
				gameState={{
					...mockGameState,
					players: [{ id: '1', name: 'Alice' }],
				}}
				onStartGame={fn()}
				onNextState={fn()}
				onRemovePlayer={fn()}
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

export const FewPlayersDesktop: Story = {
	globals: {
		viewport: {
			value: 'desktop',
		},
	},
	decorators: [
		(Story) => (
			<HostGameProvider
				isAdvancing={false}
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
				onRemovePlayer={fn()}
				onPlaySound={fn()}
				onPlayCountdownTick={fn()}
			>
				<Story />
			</HostGameProvider>
		),
	],

	tags: [
		'skip-test', // TODO: https://github.com/storybookjs/storybook/issues/29198
	],
	play: async ({ canvas, step }) => {
		await step('Verify desktop list is visible', async () => {
			const desktopList = await canvas.findByRole('region', { name: /players list/i });
			// wait for transition to complete
			await waitFor(() => expect(desktopList).toBeVisible(), { timeout: 500 });

			const mobileList = canvas.queryByRole('region', { name: /player summary/i });
			await expect(mobileList).toBeNull();
		});

		await step('Verify players in desktop view', async () => {
			const desktopList = await canvas.findByRole('region', { name: /players list/i });
			const withinDesktop = within(desktopList);

			await expect(withinDesktop.getByText('Alice')).toBeVisible();
			await expect(withinDesktop.getByText('Bob')).toBeVisible();
			await expect(withinDesktop.getByText('Charlie')).toBeVisible();

			await expect(canvas.getByText('Players (3)')).toBeVisible();
		});

		await step('Verify copy link button exists', async () => {
			const copyButton = canvas.getByRole('button', { name: /copy link/i });
			await expect(copyButton).toBeInTheDocument();
		});
	},
};

export const FewPlayersMobile: Story = {
	globals: {
		viewport: {
			value: 'mobile2',
		},
	},
	decorators: [
		(Story) => (
			<HostGameProvider
				isAdvancing={false}
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
				onRemovePlayer={fn()}
				onPlaySound={fn()}
				onPlayCountdownTick={fn()}
			>
				<Story />
			</HostGameProvider>
		),
	],
	tags: [
		'skip-test', // TODO: https://github.com/storybookjs/storybook/issues/29198
	],
	play: async ({ canvas, step }) => {
		await step('Verify mobile list is visible', async () => {
			const mobileList = await canvas.findByRole('region', { name: /player summary/i });
			await expect(mobileList).toBeVisible();

			const desktopList = canvas.queryByRole('region', { name: /players list/i });
			await expect(desktopList).toBeNull();
		});

		await step('Verify players in mobile view', async () => {
			const mobileList = await canvas.findByRole('region', { name: /player summary/i });

			// Mobile view shows "3 players joined"
			await expect(mobileList).toHaveTextContent('3 players joined');

			await expect(mobileList).toHaveTextContent('Alice');
			await expect(mobileList).toHaveTextContent('Bob');
			await expect(mobileList).toHaveTextContent('Charlie');
		});
	},
};

export const ManyPlayers: Story = {
	decorators: [
		(Story) => (
			<HostGameProvider
				isAdvancing={false}
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
				onRemovePlayer={fn()}
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
				isAdvancing={false}
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
				onRemovePlayer={fn()}
				onPlaySound={fn()}
				onPlayCountdownTick={fn()}
			>
				<Story />
			</HostGameProvider>
		),
	],
};
