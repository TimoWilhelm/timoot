import { Spinner } from './spinner';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
	title: 'Components/Spinner',
	component: Spinner,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Small: Story = {
	args: {
		size: 'sm',
	},
};

export const Medium: Story = {
	args: {
		size: 'md',
	},
};

export const Large: Story = {
	args: {
		size: 'lg',
	},
};

/**
 * This story demonstrates that multiple spinners remain synchronized,
 * proving that the animation doesn't reset when new instances mount.
 */
export const Synchronized: Story = {
	render: () => (
		<div className="flex flex-col items-center gap-8">
			<p className="text-sm text-muted-foreground">All spinners stay in sync regardless of mount time</p>
			<div className="flex items-center gap-8">
				<Spinner size="sm" />
				<Spinner size="md" />
				<Spinner size="lg" />
			</div>
		</div>
	),
};
