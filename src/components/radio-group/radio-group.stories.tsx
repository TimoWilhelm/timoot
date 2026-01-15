import { Label } from '@/components/label';

import { RadioGroup, RadioGroupItem } from './radio-group';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
	title: 'Components/RadioGroup',
	component: RadioGroup,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<RadioGroup defaultValue="option-one">
			<div className="flex items-center space-x-2">
				<RadioGroupItem value="option-one" id="option-one" />
				<Label htmlFor="option-one">Option One</Label>
			</div>
			<div className="flex items-center space-x-2">
				<RadioGroupItem value="option-two" id="option-two" />
				<Label htmlFor="option-two">Option Two</Label>
			</div>
		</RadioGroup>
	),
};
