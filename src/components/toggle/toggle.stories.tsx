import { Bold, Italic, Underline, Zap } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/button';

import { Toggle } from './toggle';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
	title: 'Components/Toggle',
	component: Toggle,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	argTypes: {
		pressed: {
			control: 'boolean',
		},
		disabled: {
			control: 'boolean',
		},
		asChild: {
			control: 'boolean',
		},
		variant: {
			control: 'select',
			options: ['default', 'accent', 'danger', 'subtle', 'ghost', 'link'],
		},
		size: {
			control: 'select',
			options: ['default', 'sm', 'lg', 'xl', 'icon'],
		},
	},
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: (arguments_) => {
		const [pressed, setPressed] = useState(false);
		return <Toggle {...arguments_} pressed={pressed} onPressedChange={setPressed} aria-label="Toggle italic" />;
	},
	args: {
		children: <Italic className="size-4" />,
	},
};

export const WithText: Story = {
	render: (arguments_) => {
		const [pressed, setPressed] = useState(false);
		return <Toggle {...arguments_} pressed={pressed} onPressedChange={setPressed} />;
	},
	args: {
		children: (
			<>
				<Bold className="mr-2 size-4" />
				Bold
			</>
		),
	},
};

export const Sizes: Story = {
	render: () => {
		const [states, setStates] = useState({ sm: false, default: false, lg: false });
		return (
			<div className="flex items-center gap-4">
				<Toggle pressed={states.sm} onPressedChange={(p) => setStates((s) => ({ ...s, sm: p }))} size="sm" aria-label="Small">
					<Italic className="size-3" />
				</Toggle>
				<Toggle
					pressed={states.default}
					onPressedChange={(p) => setStates((s) => ({ ...s, default: p }))}
					size="default"
					aria-label="Default"
				>
					<Italic className="size-4" />
				</Toggle>
				<Toggle pressed={states.lg} onPressedChange={(p) => setStates((s) => ({ ...s, lg: p }))} size="lg" aria-label="Large">
					<Italic className="size-5" />
				</Toggle>
			</div>
		);
	},
};

export const AsChild: Story = {
	render: (arguments_) => {
		const [pressed, setPressed] = useState(false);
		return (
			<Toggle {...arguments_} asChild pressed={pressed} onPressedChange={setPressed}>
				<Button variant={pressed ? 'accent' : 'subtle'} size="sm">
					<Zap className="mr-2 size-4" fill={pressed ? 'currentColor' : 'none'} />
					2x Points
				</Button>
			</Toggle>
		);
	},
};

export const Group: Story = {
	render: () => {
		const [formats, setFormats] = useState({ bold: false, italic: false, underline: false });
		return (
			<div className="flex items-center gap-1 rounded-lg border p-1">
				<Toggle
					pressed={formats.bold}
					onPressedChange={(pressed) => setFormats((f) => ({ ...f, bold: pressed }))}
					size="sm"
					variant="ghost"
					aria-label="Toggle bold"
				>
					<Bold className="size-4" />
				</Toggle>
				<Toggle
					pressed={formats.italic}
					onPressedChange={(pressed) => setFormats((f) => ({ ...f, italic: pressed }))}
					size="sm"
					variant="ghost"
					aria-label="Toggle italic"
				>
					<Italic className="size-4" />
				</Toggle>
				<Toggle
					pressed={formats.underline}
					onPressedChange={(pressed) => setFormats((f) => ({ ...f, underline: pressed }))}
					size="sm"
					variant="ghost"
					aria-label="Toggle underline"
				>
					<Underline className="size-4" />
				</Toggle>
			</div>
		);
	},
};
