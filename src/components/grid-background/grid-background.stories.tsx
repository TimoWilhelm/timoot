import { GridBackground } from './grid-background';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
	title: 'Components/GridBackground',
	component: GridBackground,
	parameters: {
		layout: 'fullscreen',
	},
	tags: ['autodocs'],
} satisfies Meta<typeof GridBackground>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<div className="relative h-100 w-full overflow-hidden border">
			<GridBackground />
			<div className="relative flex size-full items-center justify-center">
				<h1 className="text-4xl font-bold">Content</h1>
			</div>
		</div>
	),
};
