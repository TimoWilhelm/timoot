import { useState } from 'react';

import { Button } from '@/components/button';

import { AnimatedNumber } from './animated-number';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
	title: 'Components/AnimatedNumber',
	component: AnimatedNumber,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
} satisfies Meta<typeof AnimatedNumber>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		value: 100,
		className: 'text-4xl font-bold',
	},
};

export const Interactive: Story = {
	render: () => {
		const [value, setValue] = useState(0);
		return (
			<div className="flex flex-col items-center gap-4">
				<AnimatedNumber value={value} className="text-6xl font-bold text-orange" />
				<div className="flex gap-2">
					<Button onClick={() => setValue((v) => v - 100)}>-100</Button>
					<Button onClick={() => setValue((v) => v + 100)}>+100</Button>
					<Button onClick={() => setValue((v) => v + 1000)}>+1000</Button>
				</div>
			</div>
		);
	},
	args: {
		value: 0,
	},
};
