import { expect, fn } from 'storybook/test';

import { HostGameProvider } from '@/features/game/host/host-game-provider';

import { HostPageLayout } from './host-page-layout';
import { HostQuestion } from './host-question';

import type { WebSocketGameState } from '@/features/game/hooks/use-game-web-socket';
import type { Meta, StoryObj } from '@storybook/react-vite';

const mockGameState: WebSocketGameState = {
	phase: 'QUESTION:ANSWERING',
	phaseVersion: 0,
	gameId: 'ABC123',
	pin: 'ABC123',
	players: Array.from({ length: 8 }).map((_, index) => ({ id: `${index}`, name: `Player ${index}` })),
	getReadyCountdownMs: 0,
	modifiers: [],
	questionIndex: 0,
	totalQuestions: 10,
	questionText: 'What is the capital of France?',
	options: ['London', 'Paris', 'Berlin', 'Madrid'],
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
	title: 'Host/Question',
	component: HostQuestion,
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
} satisfies Meta<typeof HostQuestion>;

export default meta;
type Story = StoryObj<typeof meta>;

// Helper to render story with context
const renderStory = (arguments_: Partial<WebSocketGameState>) => (
	<HostGameProvider
		isAdvancing={false}
		gameState={{
			...mockGameState,
			...arguments_,
		}}
		onStartGame={fn()}
		onNextState={fn()}
		onRemovePlayer={fn()}
		onPlaySound={fn()}
		onPlayCountdownTick={fn()}
	>
		<HostQuestion />
	</HostGameProvider>
);

export const Default: Story = {
	render: () => renderStory({}),
	play: async ({ canvas, step }) => {
		await step('Verify question is displayed', async () => {
			await expect(canvas.getByText('What is the capital of France?')).toBeInTheDocument();
		});

		await step('Verify all options are displayed', async () => {
			await expect(canvas.getByText('London')).toBeInTheDocument();
			await expect(canvas.getByText('Paris')).toBeInTheDocument();
			await expect(canvas.getByText('Berlin')).toBeInTheDocument();
			await expect(canvas.getByText('Madrid')).toBeInTheDocument();
		});

		await step('Verify answer count is displayed', async () => {
			await expect(canvas.getByText('0/8 answered')).toBeInTheDocument();
		});
	},
};

export const SomeAnswered: Story = {
	render: () =>
		renderStory({
			questionText: 'Which planet is known as the Red Planet?',
			options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
			questionIndex: 3,
			answeredCount: 5,
		}),
};

export const AllAnswered: Story = {
	render: () =>
		renderStory({
			questionText: 'What is 2 + 2?',
			options: ['3', '4', '5', '22'],
			questionIndex: 5,
			answeredCount: 8,
		}),
};

export const DoublePoints: Story = {
	render: () =>
		renderStory({
			questionText: 'Who painted the Mona Lisa?',
			options: ['Van Gogh', 'Picasso', 'Da Vinci', 'Michelangelo'],
			questionIndex: 7,
			answeredCount: 2,
			isDoublePoints: true,
		}),
};

export const CriticalTime: Story = {
	render: () =>
		renderStory({
			questionText: 'Hurry! Name the largest mammal!',
			options: ['Elephant', 'Blue Whale', 'Giraffe', 'Hippo'],
			questionIndex: 4,
			answeredCount: 7,
		}),
};

export const WithBackgroundImage: Story = {
	render: () =>
		renderStory({
			questionText: 'What famous landmark is this?',
			options: ['Eiffel Tower', 'Big Ben', 'Statue of Liberty', 'Colosseum'],
			questionIndex: 2,
			answeredCount: 1,
			backgroundImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80',
		}),
};

export const LongQuestion: Story = {
	render: () =>
		renderStory({
			questionText:
				'In which year did the first human-made object reach the surface of the Moon, marking a significant milestone in space exploration?',
			options: ['1959', '1966', '1969', '1971'],
			questionIndex: 8,
			timeLimitMs: 30_000,
			players: Array.from({ length: 12 }).map((_, index) => ({ id: `${index}`, name: `Player ${index}` })),
		}),
};

export const TwoOptions: Story = {
	render: () =>
		renderStory({
			questionText: 'True or False: The Earth is flat.',
			options: ['True', 'False'],
			questionIndex: 1,
			timeLimitMs: 15_000,
			players: Array.from({ length: 6 }).map((_, index) => ({ id: `${index}`, name: `Player ${index}` })),
		}),
};

export const ThreeOptions: Story = {
	render: () =>
		renderStory({
			questionText: 'What color is the sky on a clear day?',
			options: ['Red', 'Blue', 'Green'],
			questionIndex: 1,
			timeLimitMs: 15_000,
			players: Array.from({ length: 6 }).map((_, index) => ({ id: `${index}`, name: `Player ${index}` })),
		}),
};
