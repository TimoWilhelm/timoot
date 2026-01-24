import { useState } from 'react';

import { Input, Root } from './otp-field';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
	title: 'Components/OneTimePasswordField',
	component: Root,
	parameters: {
		layout: 'centered',
		a11y: {
			config: {
				rules: [{ id: 'duplicate-id', enabled: false }], // OTP inputs might trigger specific ID rules contextually
			},
		},
	},
	tags: ['autodocs'],
	argTypes: {
		onValueChange: { action: 'onValueChange' },
		onComplete: { action: 'onComplete' },
	},
} satisfies Meta<typeof Root>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Render Helper
// ============================================================================

const OTPTemplate = (properties: React.ComponentProps<typeof Root>) => (
	<Root {...properties}>
		{Array.from({ length: properties.length ?? 6 }).map((_, index) => (
			<Input key={index} index={index} />
		))}
	</Root>
);

// ============================================================================
// Stories
// ============================================================================

export const Default: Story = {
	args: {
		length: 6,
		validationMode: 'alphanumeric',
		children: undefined, // Satisfy required prop in args, overridden by render
	},
	render: OTPTemplate,
};

export const Controlled = () => {
	const [value, setValue] = useState('');
	return (
		<div className="flex flex-col gap-4">
			<Root value={value} onValueChange={setValue} length={6} onComplete={(v) => alert(`Complete: ${v}`)}>
				{Array.from({ length: 6 }).map((_, index) => (
					<Input key={index} index={index} />
				))}
			</Root>
			<div className="font-mono text-sm">Current Value: {value}</div>
			<div className="flex gap-2">
				<button onClick={() => setValue('123456')} className="rounded-sm bg-black px-4 py-2 text-white">
					Set to "123456"
				</button>
				<button onClick={() => setValue('')} className="rounded-sm border border-black px-4 py-2">
					Clear
				</button>
			</div>
		</div>
	);
};

export const NumericOnly: Story = {
	args: {
		length: 4,
		validationMode: 'numeric',
		children: undefined,
	},
	render: OTPTemplate,
};

export const Disabled: Story = {
	args: {
		length: 6,
		disabled: true,
		defaultValue: '123456',
		children: undefined,
	},
	render: OTPTemplate,
};

export const FormSubmission = () => {
	return (
		<form
			onSubmit={(event) => {
				event.preventDefault();
				const formData = new FormData(event.currentTarget);
				alert(`Submitted: ${formData.get('otp')}`);
			}}
			className="space-y-4"
		>
			<Root name="otp" length={5} autoSubmit>
				{Array.from({ length: 5 }).map((_, index) => (
					<Input key={index} index={index} />
				))}
			</Root>
			<button type="submit" className="rounded-sm bg-black px-4 py-2 text-white">
				Submit
			</button>
		</form>
	);
};
