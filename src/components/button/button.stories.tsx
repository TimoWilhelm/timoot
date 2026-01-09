import { Button } from './button';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
	title: 'Components/Button',
	component: Button,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	argTypes: {
		variant: {
			control: 'select',
			options: ['default', 'accent', 'danger', 'subtle', 'ghost', 'link', 'dark-default', 'dark-accent', 'dark-subtle', 'dark-ghost'],
		},
		size: {
			control: 'select',
			options: ['default', 'sm', 'lg', 'xl', 'icon'],
		},
		disabled: {
			control: 'boolean',
		},
	},
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		children: 'Button',
		variant: 'default',
	},
};

export const Accent: Story = {
	args: {
		children: 'Accent Button',
		variant: 'accent',
	},
};

export const Danger: Story = {
	args: {
		children: 'Delete',
		variant: 'danger',
	},
};

export const Subtle: Story = {
	args: {
		children: 'Subtle Button',
		variant: 'subtle',
	},
};

export const Ghost: Story = {
	args: {
		children: 'Ghost Button',
		variant: 'ghost',
	},
};

export const Link: Story = {
	args: {
		children: 'Link Button',
		variant: 'link',
	},
};

export const Small: Story = {
	args: {
		children: 'Small',
		size: 'sm',
	},
};

export const Large: Story = {
	args: {
		children: 'Large Button',
		size: 'lg',
	},
};

export const ExtraLarge: Story = {
	args: {
		children: 'Start Game',
		size: 'xl',
	},
};

export const Icon: Story = {
	args: {
		children: '✕',
		size: 'icon',
		variant: 'subtle',
	},
};

export const Disabled: Story = {
	args: {
		children: 'Disabled',
		disabled: true,
	},
};

// Dark variants for player pages with dark backgrounds
export const DarkDefault: Story = {
	args: {
		children: 'Dark Button',
		variant: 'dark-default',
	},
	parameters: {
		backgrounds: { default: 'dark' },
	},
	decorators: [
		(Story) => (
			<div className="rounded-lg bg-slate p-8">
				<Story />
			</div>
		),
	],
};

export const DarkAccent: Story = {
	args: {
		children: 'Submit Answer',
		variant: 'dark-accent',
	},
	decorators: [
		(Story) => (
			<div className="rounded-lg bg-slate p-8">
				<Story />
			</div>
		),
	],
};

export const DarkSubtle: Story = {
	args: {
		children: 'Skip',
		variant: 'dark-subtle',
	},
	decorators: [
		(Story) => (
			<div className="rounded-lg bg-slate p-8">
				<Story />
			</div>
		),
	],
};

export const DarkGhost: Story = {
	args: {
		children: 'Cancel',
		variant: 'dark-ghost',
	},
	decorators: [
		(Story) => (
			<div className="rounded-lg bg-slate p-8">
				<Story />
			</div>
		),
	],
};

export const AllVariants: Story = {
	render: () => (
		<div className="flex flex-col gap-4">
			<div className="flex flex-wrap gap-2">
				<Button variant="default">Default</Button>
				<Button variant="accent">Accent</Button>
				<Button variant="danger">Danger</Button>
				<Button variant="subtle">Subtle</Button>
				<Button variant="ghost">Ghost</Button>
				<Button variant="link">Link</Button>
			</div>
			<div className="flex flex-wrap gap-2 rounded-lg bg-slate p-4">
				<Button variant="dark-default">Dark Default</Button>
				<Button variant="dark-accent">Dark Accent</Button>
				<Button variant="dark-subtle">Dark Subtle</Button>
				<Button variant="dark-ghost">Dark Ghost</Button>
			</div>
		</div>
	),
};

export const AllSizes: Story = {
	render: () => (
		<div className="flex items-center gap-2">
			<Button size="sm">Small</Button>
			<Button size="default">Default</Button>
			<Button size="lg">Large</Button>
			<Button size="xl">Extra Large</Button>
			<Button size="icon">✕</Button>
		</div>
	),
};
