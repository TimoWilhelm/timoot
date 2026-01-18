import { useState } from 'react';
import { expect, fn } from 'storybook/test';

import { PlayerGameProvider } from '@/features/game/player/player-game-provider';

import { PlayerAnswer } from './player-answer';
import { PlayerPageLayout } from './player-page-layout';

import type { WebSocketGameState } from '@/features/game/hooks/use-game-web-socket';
import type { Meta, StoryObj } from '@storybook/react-vite';

const mockGameState: WebSocketGameState = {
	phase: 'QUESTION',
	gameId: 'ABC123',
	pin: 'ABC123',
	players: [],
	getReadyCountdownMs: 0,
	modifiers: [],
	questionIndex: 0,
	totalQuestions: 10,
	questionText: 'Test Question',
	options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
	startTime: Date.now(),
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

function PlayerAnswerWrapper({
	onAnswer,
	submittedAnswer: initialAnswer,
	optionIndices,
}: {
	onAnswer: (index: number) => void;
	submittedAnswer: number | undefined;
	optionIndices: number[];
}) {
	const [submittedAnswer, setSubmittedAnswer] = useState(initialAnswer);
	return (
		<PlayerGameProvider
			gameState={{
				...mockGameState,
				options: Array.from({ length: optionIndices.length }, (_, index) => `Option ${index + 1}`),
			}}
			nickname="Player"
			score={100}
			hasInitialScoreSync={true}
			submittedAnswer={submittedAnswer}
			onAnswer={(index) => {
				setSubmittedAnswer(index);
				onAnswer(index);
			}}
			onSendEmoji={fn()}
		>
			<div className="flex flex-1 items-center justify-center">
				<PlayerAnswer />
			</div>
		</PlayerGameProvider>
	);
}

const meta = {
	title: 'Player/AnswerScreen',
	component: PlayerAnswerWrapper,
	parameters: {
		layout: 'fullscreen',
		backgrounds: { default: 'dark' },
	},
	args: {
		onAnswer: fn(),
	},
	decorators: [
		(Story) => (
			<PlayerPageLayout variant="game">
				<Story />
			</PlayerPageLayout>
		),
	],
} satisfies Meta<typeof PlayerAnswerWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FourOptions: Story = {
	args: {
		optionIndices: [0, 1, 2, 3],
		submittedAnswer: undefined,
	},
	play: async ({ canvas }) => {
		const buttons = canvas.getAllByRole('button');
		await expect(buttons).toHaveLength(4);
		for (const button of buttons) {
			await expect(button).toBeEnabled();
		}
	},
};

export const ThreeOptions: Story = {
	args: {
		optionIndices: [0, 1, 2],
		submittedAnswer: undefined,
	},
};

export const TwoOptions: Story = {
	args: {
		optionIndices: [0, 1],
		submittedAnswer: undefined,
	},
	play: async ({ canvas }) => {
		const buttons = canvas.getAllByRole('button');
		await expect(buttons).toHaveLength(2);
	},
};

export const ClickFirstOption: Story = {
	args: {
		optionIndices: [0, 1, 2, 3],
		submittedAnswer: undefined,
	},
	play: async ({ args, canvas, userEvent }) => {
		const buttons = canvas.getAllByRole('button');
		await userEvent.click(buttons[0]);
		await expect(args.onAnswer).toHaveBeenCalledWith(0);
	},
};

export const ClickSecondOption: Story = {
	args: {
		optionIndices: [0, 1, 2, 3],
		submittedAnswer: undefined,
	},
	play: async ({ args, canvas, userEvent }) => {
		const buttons = canvas.getAllByRole('button');
		await userEvent.click(buttons[1]);
		await expect(args.onAnswer).toHaveBeenCalledWith(1);
	},
};

export const FirstSelected: Story = {
	args: {
		optionIndices: [0, 1, 2, 3],
		submittedAnswer: 0,
	},
	play: async ({ canvas }) => {
		const buttons = canvas.getAllByRole('button');
		for (const button of buttons) {
			await expect(button).toBeDisabled();
		}
	},
};

export const SecondSelected: Story = {
	args: {
		optionIndices: [0, 1, 2, 3],
		submittedAnswer: 1,
	},
};

export const ThirdSelected: Story = {
	args: {
		optionIndices: [0, 1, 2, 3],
		submittedAnswer: 2,
	},
};

export const FourthSelected: Story = {
	args: {
		optionIndices: [0, 1, 2, 3],
		submittedAnswer: 3,
	},
};
