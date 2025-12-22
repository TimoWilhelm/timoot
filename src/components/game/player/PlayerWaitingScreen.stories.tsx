import type { Meta, StoryObj } from '@storybook/react-vite';
import { PlayerWaitingScreen } from './PlayerWaitingScreen';

const meta = {
	title: 'Player/WaitingScreen',
	component: PlayerWaitingScreen,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [
		(Story) => (
			<div className="flex min-h-screen items-center justify-center bg-slate-800 p-4 text-white">
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof PlayerWaitingScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Lobby: Story = {
	args: {
		phase: 'LOBBY',
		answerResult: null,
		playerId: 'player1',
	},
};

export const GetReady: Story = {
	args: {
		phase: 'GET_READY',
		answerResult: null,
		playerId: 'player1',
	},
};

export const QuestionModifierDoublePoints: Story = {
	args: {
		phase: 'QUESTION_MODIFIER',
		answerResult: null,
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
		answerResult: null,
		playerId: 'player1',
	},
};

export const LeaderboardFirstPlace: Story = {
	args: {
		phase: 'LEADERBOARD',
		answerResult: null,
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
		answerResult: null,
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
		answerResult: null,
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
		answerResult: null,
		playerId: 'player1',
	},
};

export const EndRevealedFirstPlace: Story = {
	args: {
		phase: 'END_REVEALED',
		answerResult: null,
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
		answerResult: null,
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
		answerResult: null,
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
		answerResult: null,
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
