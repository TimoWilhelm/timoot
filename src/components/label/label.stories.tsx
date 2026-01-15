import { Input } from '@/components/input';

import { Label } from './label';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
	title: 'Components/Label',
	component: Label,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		children: 'Email Address',
		htmlFor: 'email',
	},
};

export const WithInput: Story = {
	render: () => (
		<div className="grid w-full max-w-sm items-center gap-1.5">
			<Label htmlFor="email-2">Email</Label>
			<Input type="email" id="email-2" placeholder="Email" />
		</div>
	),
};
