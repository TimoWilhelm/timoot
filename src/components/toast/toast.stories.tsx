import { Button } from '@/components/button';

import { toast } from './toast';
import { Toaster } from './toaster';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
	title: 'Components/Toast',
	component: Toaster,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<div className="flex h-96 w-full items-center justify-center bg-muted">
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export function ToastDemo() {
	return (
		<div className="flex flex-col gap-4">
			<Toaster />
			<div className="grid grid-cols-2 gap-4">
				<Button
					variant="default"
					onClick={() =>
						toast.custom('Event has been created', {
							description: 'Sunday, December 03, 2023 at 9:00 AM',
						})
					}
				>
					Default Toast
				</Button>
				<Button
					variant="default"
					className="
						bg-green
						hover:bg-green/90
					"
					onClick={() => toast.success('Payment successful', { description: 'Your order has been processed.' })}
				>
					Success Toast
				</Button>
				<Button
					variant="danger"
					onClick={() => toast.error('Uh oh! Something went wrong.', { description: 'There was a problem with your request.' })}
				>
					Error Toast
				</Button>
				<Button
					variant="subtle"
					onClick={() =>
						toast.info('New update available', {
							description: 'Click to install the latest version.',
						})
					}
				>
					Info Toast
				</Button>
				<Button
					variant="accent"
					onClick={() =>
						toast.warning('Storage almost full', {
							description: 'You have used 95% of your storage space.',
						})
					}
				>
					Warning Toast
				</Button>
			</div>
		</div>
	);
}

export const Default: Story = {
	render: () => <ToastDemo />,
};
