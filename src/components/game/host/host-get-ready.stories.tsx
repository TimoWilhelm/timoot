import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { HostGetReady } from './host-get-ready';

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
		(Story) => (
			<div className="min-h-screen bg-muted">
				<Story />
			</div>
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
