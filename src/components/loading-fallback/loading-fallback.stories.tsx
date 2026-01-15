import { LoadingFallback } from './loading-fallback';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
	title: 'Components/LoadingFallback',
	component: LoadingFallback,
	parameters: {
		layout: 'fullscreen',
	},
	tags: ['autodocs'],
} satisfies Meta<typeof LoadingFallback>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
