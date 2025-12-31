import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { HostQuestion } from './host-question';

const meta = {
	title: 'Host/Question',
	component: HostQuestion,
	parameters: {
		layout: 'fullscreen',
	},
	args: {
		onNext: fn(),
		onCountdownTick: fn(),
		onTimeUp: fn(),
	},
	decorators: [
		(Story) => (
			<div className="flex min-h-screen flex-col bg-muted">
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof HostQuestion>;

export default meta;
type Story = StoryObj<typeof meta>;

// Helper to create fresh startTime for each story render
const createLoader = (offsetMs = 0) => [() => ({ startTime: Date.now() - offsetMs })];

export const Default: Story = {
	args: {
		questionText: 'What is the capital of France?',
		options: ['London', 'Paris', 'Berlin', 'Madrid'],
		questionIndex: 0,
		totalQuestions: 10,
		startTime: 0,
		timeLimitMs: 20_000,
		answeredCount: 0,
		totalPlayers: 8,
		isDoublePoints: false,
	},
	loaders: createLoader(0),
	render: (arguments_, { loaded }) => <HostQuestion {...arguments_} startTime={loaded.startTime as number} />,
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
	args: {
		questionText: 'Which planet is known as the Red Planet?',
		options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
		questionIndex: 3,
		totalQuestions: 10,
		startTime: 0,
		timeLimitMs: 20_000,
		answeredCount: 5,
		totalPlayers: 8,
		isDoublePoints: false,
	},
	loaders: createLoader(5000),
	render: (arguments_, { loaded }) => <HostQuestion {...arguments_} startTime={loaded.startTime as number} />,
};

export const AllAnswered: Story = {
	args: {
		questionText: 'What is 2 + 2?',
		options: ['3', '4', '5', '22'],
		questionIndex: 5,
		totalQuestions: 10,
		startTime: 0,
		timeLimitMs: 20_000,
		answeredCount: 8,
		totalPlayers: 8,
		isDoublePoints: false,
	},
	loaders: createLoader(10_000),
	render: (arguments_, { loaded }) => <HostQuestion {...arguments_} startTime={loaded.startTime as number} />,
};

export const DoublePoints: Story = {
	args: {
		questionText: 'Who painted the Mona Lisa?',
		options: ['Van Gogh', 'Picasso', 'Da Vinci', 'Michelangelo'],
		questionIndex: 7,
		totalQuestions: 10,
		startTime: 0,
		timeLimitMs: 20_000,
		answeredCount: 2,
		totalPlayers: 8,
		isDoublePoints: true,
	},
	loaders: createLoader(0),
	render: (arguments_, { loaded }) => <HostQuestion {...arguments_} startTime={loaded.startTime as number} />,
};

export const CriticalTime: Story = {
	args: {
		questionText: 'Hurry! Name the largest mammal!',
		options: ['Elephant', 'Blue Whale', 'Giraffe', 'Hippo'],
		questionIndex: 4,
		totalQuestions: 10,
		startTime: 0,
		timeLimitMs: 20_000,
		answeredCount: 7,
		totalPlayers: 8,
		isDoublePoints: false,
	},
	loaders: createLoader(18_000),
	render: (arguments_, { loaded }) => <HostQuestion {...arguments_} startTime={loaded.startTime as number} />,
};

export const WithBackgroundImage: Story = {
	args: {
		questionText: 'What famous landmark is this?',
		options: ['Eiffel Tower', 'Big Ben', 'Statue of Liberty', 'Colosseum'],
		questionIndex: 2,
		totalQuestions: 10,
		startTime: 0,
		timeLimitMs: 20_000,
		answeredCount: 1,
		totalPlayers: 8,
		isDoublePoints: false,
		backgroundImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80',
	},
	loaders: createLoader(0),
	render: (arguments_, { loaded }) => <HostQuestion {...arguments_} startTime={loaded.startTime as number} />,
};

export const LongQuestion: Story = {
	args: {
		questionText:
			'In which year did the first human-made object reach the surface of the Moon, marking a significant milestone in space exploration?',
		options: ['1959', '1966', '1969', '1971'],
		questionIndex: 8,
		totalQuestions: 10,
		startTime: 0,
		timeLimitMs: 30_000,
		answeredCount: 0,
		totalPlayers: 12,
		isDoublePoints: false,
	},
	loaders: createLoader(0),
	render: (arguments_, { loaded }) => <HostQuestion {...arguments_} startTime={loaded.startTime as number} />,
};

export const TwoOptions: Story = {
	args: {
		questionText: 'True or False: The Earth is flat.',
		options: ['True', 'False'],
		questionIndex: 1,
		totalQuestions: 10,
		startTime: 0,
		timeLimitMs: 15_000,
		answeredCount: 0,
		totalPlayers: 6,
		isDoublePoints: false,
	},
	loaders: createLoader(0),
	render: (arguments_, { loaded }) => <HostQuestion {...arguments_} startTime={loaded.startTime as number} />,
};

export const ThreeOptions: Story = {
	args: {
		questionText: 'What color is the sky on a clear day?',
		options: ['Red', 'Blue', 'Green'],
		questionIndex: 1,
		totalQuestions: 10,
		startTime: 0,
		timeLimitMs: 15_000,
		answeredCount: 0,
		totalPlayers: 6,
		isDoublePoints: false,
	},
	loaders: createLoader(0),
	render: (arguments_, { loaded }) => <HostQuestion {...arguments_} startTime={loaded.startTime as number} />,
};
