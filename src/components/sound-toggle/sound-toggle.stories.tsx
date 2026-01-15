import { SoundToggle } from './sound-toggle';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
	title: 'Components/SoundToggle',
	component: SoundToggle,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
} satisfies Meta<typeof SoundToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomExample: Story = {
	args: {
		className: 'size-12',
	},
};
