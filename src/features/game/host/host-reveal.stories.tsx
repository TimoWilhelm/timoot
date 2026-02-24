import { expect, fn } from 'storybook/test';

import { HostGameProvider } from '@/features/game/host/host-game-provider';

import { HostPageLayout } from './host-page-layout';
import { HostReveal } from './host-reveal';

import type { WebSocketGameState } from '@/features/game/hooks/use-game-web-socket';
import type { Meta, StoryObj } from '@storybook/react-vite';

const mockGameState: WebSocketGameState = {
	phase: 'REVEAL',
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
	title: 'Host/Reveal',
	component: HostReveal,
	parameters: {
		layout: 'fullscreen',
	},
	args: {
		onNext: fn(),
	},
	decorators: [
		(Story, { args }) => (
			<HostGameProvider
				isAdvancing={false}
				gameState={{
					...mockGameState,
					...args,
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
} satisfies Meta<typeof HostReveal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MostCorrect: Story = {
	args: {
		questionText: 'What is the capital of France?',
		options: ['London', 'Paris', 'Berlin', 'Madrid'],
		correctAnswerIndex: 1,
		answerCounts: [2, 10, 1, 1],
	},
	play: async ({ canvas, step }) => {
		await step('Verify question is displayed', async () => {
			await expect(canvas.getByText('What is the capital of France?')).toBeInTheDocument();
		});

		await step('Verify correct answer (Paris) is shown', async () => {
			await expect(canvas.getByText('Paris')).toBeInTheDocument();
		});

		await step('Verify answer counts are displayed', async () => {
			await expect(canvas.getByText('10')).toBeInTheDocument();
		});
	},
};

export const Split: Story = {
	args: {
		questionText: 'Which planet is known as the Red Planet?',
		options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
		correctAnswerIndex: 1,
		answerCounts: [4, 5, 3, 2],
	},
};

export const AllWrong: Story = {
	args: {
		questionText: 'What is the smallest country in the world?',
		options: ['Monaco', 'Vatican City', 'San Marino', 'Liechtenstein'],
		correctAnswerIndex: 1,
		answerCounts: [5, 0, 4, 3],
	},
};

export const AllCorrect: Story = {
	args: {
		questionText: 'What is 2 + 2?',
		options: ['3', '4', '5', '22'],
		correctAnswerIndex: 1,
		answerCounts: [0, 12, 0, 0],
	},
};

export const FirstOptionCorrect: Story = {
	args: {
		questionText: 'What is the first letter of the alphabet?',
		options: ['A', 'B', 'C', 'D'],
		correctAnswerIndex: 0,
		answerCounts: [8, 2, 1, 1],
	},
};

export const LastOptionCorrect: Story = {
	args: {
		questionText: 'What is the last letter of the alphabet?',
		options: ['W', 'X', 'Y', 'Z'],
		correctAnswerIndex: 3,
		answerCounts: [1, 2, 3, 6],
	},
};

export const TwoOptions: Story = {
	args: {
		questionText: 'True or False: The Earth is round.',
		options: ['True', 'False'],
		correctAnswerIndex: 0,
		answerCounts: [10, 2],
	},
};

export const NoAnswers: Story = {
	args: {
		questionText: 'This was a tough one!',
		options: ['Option A', 'Option B', 'Option C', 'Option D'],
		correctAnswerIndex: 2,
		answerCounts: [0, 0, 0, 0],
	},
};
