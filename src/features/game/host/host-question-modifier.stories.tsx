import { fn } from 'storybook/test';

import { HostGameProvider } from '@/features/game/host/host-game-provider';

import { HostPageLayout } from './host-page-layout';
import { HostQuestionModifier } from './host-question-modifier';

import type { WebSocketGameState } from '@/features/game/hooks/use-game-web-socket';
import type { Meta, StoryObj } from '@storybook/react-vite';

const mockGameState: WebSocketGameState = {
	phase: 'QUESTION_MODIFIER',
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
	title: 'Host/QuestionModifier',
	component: HostQuestionModifier,
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
} satisfies Meta<typeof HostQuestionModifier>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DoublePoints: Story = {
	args: {
		questionIndex: 2,
		totalQuestions: 10,
		modifiers: ['doublePoints'],
	},
};

export const NoModifiers: Story = {
	args: {
		questionIndex: 3,
		totalQuestions: 10,
		modifiers: [],
	},
};
