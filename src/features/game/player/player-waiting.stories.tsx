import { fn } from 'storybook/test';

import { PlayerGameProvider } from '@/features/game/player/player-game-provider';

import { PlayerPageLayout } from './player-page-layout';
import { PlayerWaiting } from './player-waiting';

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

interface PlayerWaitingWrapperProperties {
	phase?: WebSocketGameState['phase'];
	answerResult?: { isCorrect: boolean; score: number };
	finalScore?: number;
	playerId?: string;
	leaderboard?: WebSocketGameState['leaderboard'];
	modifiers?: WebSocketGameState['modifiers'];
}

function PlayerWaitingWrapper({ phase, answerResult, finalScore, playerId, leaderboard, modifiers }: PlayerWaitingWrapperProperties) {
	return (
		<PlayerGameProvider
			gameState={{
				...mockGameState,
				phase: phase ?? mockGameState.phase,
				leaderboard: leaderboard || [],
				modifiers: modifiers || [],
			}}
			nickname="Player"
			score={finalScore || 100}
			hasInitialScoreSync={true}
			answerResult={answerResult}
			playerId={playerId}
			onAnswer={fn()}
			onSendEmoji={fn()}
		>
			<div className="flex flex-1 items-center justify-center">
				<PlayerWaiting />
			</div>
		</PlayerGameProvider>
	);
}

const meta = {
	title: 'Player/WaitingScreen',
	component: PlayerWaitingWrapper,
	parameters: {
		layout: 'fullscreen',
		backgrounds: { default: 'dark' },
	},
	decorators: [
		(Story) => (
			<PlayerPageLayout variant="game">
				<Story />
			</PlayerPageLayout>
		),
	],
} satisfies Meta<typeof PlayerWaitingWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Lobby: Story = {
	args: {
		phase: 'LOBBY',
		answerResult: undefined,
		playerId: 'player1',
	},
};

export const GetReady: Story = {
	args: {
		phase: 'GET_READY',
		answerResult: undefined,
		playerId: 'player1',
	},
};

export const QuestionModifierDoublePoints: Story = {
	args: {
		phase: 'QUESTION_MODIFIER',
		answerResult: undefined,
		playerId: 'player1',
		modifiers: ['doublePoints'],
	},
};

export const RevealCorrect: Story = {
	args: {
		phase: 'REVEAL',
		answerResult: { isCorrect: true, score: 850 },
		playerId: 'player1',
	},
};

export const RevealIncorrect: Story = {
	args: {
		phase: 'REVEAL',
		answerResult: { isCorrect: false, score: 0 },
		playerId: 'player1',
	},
};

export const RevealNoAnswer: Story = {
	args: {
		phase: 'REVEAL',
		answerResult: undefined,
		playerId: 'player1',
	},
};

export const LeaderboardFirstPlace: Story = {
	args: {
		phase: 'LEADERBOARD',
		answerResult: undefined,
		playerId: 'player1',
		leaderboard: [
			{ id: 'player1', name: 'You', score: 2500, rank: 1 },
			{ id: 'player2', name: 'Bob', score: 2200, rank: 2 },
			{ id: 'player3', name: 'Charlie', score: 1800, rank: 3 },
		],
	},
};

export const LeaderboardMiddle: Story = {
	args: {
		phase: 'LEADERBOARD',
		answerResult: undefined,
		playerId: 'player1',
		leaderboard: [
			{ id: 'player2', name: 'Alice', score: 2500, rank: 1 },
			{ id: 'player3', name: 'Bob', score: 2200, rank: 2 },
			{ id: 'player1', name: 'You', score: 1800, rank: 3 },
			{ id: 'player4', name: 'Diana', score: 1500, rank: 4 },
			{ id: 'player5', name: 'Eve', score: 1200, rank: 5 },
		],
	},
};

export const LeaderboardNotInTop: Story = {
	args: {
		phase: 'LEADERBOARD',
		answerResult: undefined,
		playerId: 'player10',
		leaderboard: [
			{ id: 'player1', name: 'Alice', score: 2500, rank: 1 },
			{ id: 'player2', name: 'Bob', score: 2200, rank: 2 },
			{ id: 'player3', name: 'Charlie', score: 1800, rank: 3 },
		],
	},
};

export const EndIntro: Story = {
	args: {
		phase: 'END_INTRO',
		answerResult: undefined,
		playerId: 'player1',
	},
};

export const EndRevealedFirstPlace: Story = {
	args: {
		phase: 'END_REVEALED',
		answerResult: undefined,
		finalScore: 5000,
		playerId: 'player1',
		leaderboard: [
			{ id: 'player1', name: 'You', score: 5000, rank: 1 },
			{ id: 'player2', name: 'Bob', score: 4800, rank: 2 },
			{ id: 'player3', name: 'Charlie', score: 4200, rank: 3 },
		],
	},
};

export const EndRevealedSecondPlace: Story = {
	args: {
		phase: 'END_REVEALED',
		answerResult: undefined,
		finalScore: 4800,
		playerId: 'player1',
		leaderboard: [
			{ id: 'player2', name: 'Alice', score: 5000, rank: 1 },
			{ id: 'player1', name: 'You', score: 4800, rank: 2 },
			{ id: 'player3', name: 'Charlie', score: 4200, rank: 3 },
		],
	},
};

export const EndRevealedThirdPlace: Story = {
	args: {
		phase: 'END_REVEALED',
		answerResult: undefined,
		finalScore: 4200,
		playerId: 'player1',
		leaderboard: [
			{ id: 'player2', name: 'Alice', score: 5000, rank: 1 },
			{ id: 'player3', name: 'Bob', score: 4800, rank: 2 },
			{ id: 'player1', name: 'You', score: 4200, rank: 3 },
		],
	},
};

export const EndRevealedNotOnPodium: Story = {
	args: {
		phase: 'END_REVEALED',
		answerResult: undefined,
		finalScore: 2000,
		playerId: 'player1',
		leaderboard: [
			{ id: 'player2', name: 'Alice', score: 5000, rank: 1 },
			{ id: 'player3', name: 'Bob', score: 4800, rank: 2 },
			{ id: 'player4', name: 'Charlie', score: 4200, rank: 3 },
			{ id: 'player5', name: 'Diana', score: 3000, rank: 4 },
			{ id: 'player1', name: 'You', score: 2000, rank: 5 },
		],
	},
};
