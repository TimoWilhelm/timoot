import type { Meta, StoryObj } from '@storybook/react-vite';
import { HostQuestion } from './HostQuestion';
import { fn } from 'storybook/test';

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
			<div className="flex min-h-screen flex-col bg-slate-100">
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof HostQuestion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		questionText: 'What is the capital of France?',
		options: ['London', 'Paris', 'Berlin', 'Madrid'],
		questionIndex: 0,
		totalQuestions: 10,
		startTime: Date.now(),
		timeLimitMs: 20000,
		answeredCount: 0,
		totalPlayers: 8,
		isDoublePoints: false,
	},
};

export const SomeAnswered: Story = {
	args: {
		questionText: 'Which planet is known as the Red Planet?',
		options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
		questionIndex: 3,
		totalQuestions: 10,
		startTime: Date.now() - 5000,
		timeLimitMs: 20000,
		answeredCount: 5,
		totalPlayers: 8,
		isDoublePoints: false,
	},
};

export const AllAnswered: Story = {
	args: {
		questionText: 'What is 2 + 2?',
		options: ['3', '4', '5', '22'],
		questionIndex: 5,
		totalQuestions: 10,
		startTime: Date.now() - 10000,
		timeLimitMs: 20000,
		answeredCount: 8,
		totalPlayers: 8,
		isDoublePoints: false,
	},
};

export const DoublePoints: Story = {
	args: {
		questionText: 'Who painted the Mona Lisa?',
		options: ['Van Gogh', 'Picasso', 'Da Vinci', 'Michelangelo'],
		questionIndex: 7,
		totalQuestions: 10,
		startTime: Date.now(),
		timeLimitMs: 20000,
		answeredCount: 2,
		totalPlayers: 8,
		isDoublePoints: true,
	},
};

export const LowTime: Story = {
	args: {
		questionText: 'Quick! What is the largest ocean?',
		options: ['Atlantic', 'Pacific', 'Indian', 'Arctic'],
		questionIndex: 4,
		totalQuestions: 10,
		startTime: Date.now() - 17000,
		timeLimitMs: 20000,
		answeredCount: 6,
		totalPlayers: 8,
		isDoublePoints: false,
	},
};

export const CriticalTime: Story = {
	args: {
		questionText: 'Hurry! Name the largest mammal!',
		options: ['Elephant', 'Blue Whale', 'Giraffe', 'Hippo'],
		questionIndex: 4,
		totalQuestions: 10,
		startTime: Date.now() - 18000,
		timeLimitMs: 20000,
		answeredCount: 7,
		totalPlayers: 8,
		isDoublePoints: false,
	},
};

export const WithBackgroundImage: Story = {
	args: {
		questionText: 'What famous landmark is this?',
		options: ['Eiffel Tower', 'Big Ben', 'Statue of Liberty', 'Colosseum'],
		questionIndex: 2,
		totalQuestions: 10,
		startTime: Date.now(),
		timeLimitMs: 20000,
		answeredCount: 1,
		totalPlayers: 8,
		isDoublePoints: false,
		backgroundImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80',
	},
};

export const LongQuestion: Story = {
	args: {
		questionText:
			'In which year did the first human-made object reach the surface of the Moon, marking a significant milestone in space exploration?',
		options: ['1959', '1966', '1969', '1971'],
		questionIndex: 8,
		totalQuestions: 10,
		startTime: Date.now(),
		timeLimitMs: 30000,
		answeredCount: 0,
		totalPlayers: 12,
		isDoublePoints: false,
	},
};

export const TwoOptions: Story = {
	args: {
		questionText: 'True or False: The Earth is flat.',
		options: ['True', 'False'],
		questionIndex: 1,
		totalQuestions: 10,
		startTime: Date.now(),
		timeLimitMs: 15000,
		answeredCount: 0,
		totalPlayers: 6,
		isDoublePoints: false,
	},
};

export const ThreeOptions: Story = {
	args: {
		questionText: 'What color is the sky on a clear day?',
		options: ['Red', 'Blue', 'Green'],
		questionIndex: 1,
		totalQuestions: 10,
		startTime: Date.now(),
		timeLimitMs: 15000,
		answeredCount: 0,
		totalPlayers: 6,
		isDoublePoints: false,
	},
};
