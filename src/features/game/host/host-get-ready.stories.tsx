import { fn } from 'storybook/test';

import { HostGameProvider } from '@/features/game/host/host-game-provider';

import { HostGetReady } from './host-get-ready';
import { HostPageLayout } from './host-page-layout';

import type { WebSocketGameState } from '@/features/game/hooks/use-game-web-socket';
import type { Meta, StoryObj } from '@storybook/react-vite';

const mockGameState: WebSocketGameState = {
	phase: 'GET_READY',
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
	title: 'Host/GetReady',
	component: HostGetReady,
	parameters: {
		layout: 'fullscreen',
	},
	args: {
		onCountdownBeep: fn(),
	},
	decorators: [
		(Story, { args }) => (
			<HostGameProvider
				isAdvancing={false}
				gameState={{
					...mockGameState,
					...args,
					getReadyCountdownMs: (() => {
						if (typeof args === 'object' && args !== null) {
							const value = Reflect.get(args, 'countdownMs');
							if (typeof value === 'number') return value;
						}
						return mockGameState.getReadyCountdownMs;
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
} satisfies Meta<typeof HostGetReady>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		countdownMs: 5000,
		totalQuestions: 10,
	},
};

export const ShortCountdown: Story = {
	args: {
		countdownMs: 3000,
		totalQuestions: 5,
	},
};

export const LongQuiz: Story = {
	args: {
		countdownMs: 5000,
		totalQuestions: 25,
	},
};
