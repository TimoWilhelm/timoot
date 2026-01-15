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
		children: (
			<>
				<Input index={0} />
				<Input index={1} />
				<Input index={2} />
				<Input index={3} />
				<Input index={4} />
				<Input index={5} />
			</>
		),
	},
};

export const Numeric: Story = {
	args: {
		length: 4,
		validationMode: 'numeric',
		children: (
			<>
				<Input index={0} />
				<Input index={1} />
				<Input index={2} />
				<Input index={3} />
			</>
		),
	},
};

export const Disabled: Story = {
	args: {
		length: 6,
		disabled: true,
		children: (
			<>
				<Input index={0} />
				<Input index={1} />
				<Input index={2} />
				<Input index={3} />
				<Input index={4} />
				<Input index={5} />
			</>
		),
	},
};
