import { Input, Root } from './otp-field';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
	title: 'Components/OneTimePasswordField',
	component: Root,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
} satisfies Meta<typeof Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		length: 6,
		validationMode: 'alphanumeric',
		children: undefined,
	},
	render: (arguments_) => (
		<Root {...arguments_}>
			{Array.from({ length: arguments_.length ?? 6 }).map((_, index) => (
				<Input key={index} index={index} />
			))}
		</Root>
	),
};

export const Numeric: Story = {
	args: {
		length: 4,
		validationMode: 'numeric',
		children: undefined,
	},
	render: (arguments_) => (
		<Root {...arguments_}>
			{Array.from({ length: arguments_.length ?? 4 }).map((_, index) => (
				<Input key={index} index={index} />
			))}
		</Root>
	),
};

export const Disabled: Story = {
	args: {
		length: 6,
		disabled: true,
		children: undefined,
	},
	render: (arguments_) => (
		<Root {...arguments_}>
			{Array.from({ length: arguments_.length ?? 6 }).map((_, index) => (
				<Input key={index} index={index} />
			))}
		</Root>
	),
};
