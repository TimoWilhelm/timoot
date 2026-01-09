import { useState } from 'react';

import { Button } from '@/components/button';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './dialog';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
	title: 'Components/Dialog',
	component: Dialog,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => {
		const [open, setOpen] = useState(false);
		return (
			<>
				<Button onClick={() => setOpen(true)}>Open Dialog</Button>
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Dialog Title</DialogTitle>
							<DialogDescription>This is a description of what this dialog is for.</DialogDescription>
						</DialogHeader>
						<div className="p-6 pt-0">
							<p>Dialog content goes here.</p>
						</div>
						<DialogFooter className="p-6 pt-0">
							<Button variant="subtle" onClick={() => setOpen(false)}>
								Cancel
							</Button>
							<Button variant="accent" onClick={() => setOpen(false)}>
								Confirm
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</>
		);
	},
};

export const ConfirmDelete: Story = {
	render: () => {
		const [open, setOpen] = useState(false);
		return (
			<>
				<Button variant="danger" onClick={() => setOpen(true)}>
					Delete Quiz
				</Button>
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Delete Quiz?</DialogTitle>
							<DialogDescription>
								This action cannot be undone. This will permanently delete your quiz and all associated data.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter className="p-6 pt-0">
							<Button variant="subtle" onClick={() => setOpen(false)}>
								Cancel
							</Button>
							<Button variant="danger" onClick={() => setOpen(false)}>
								Delete
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</>
		);
	},
};

export const UnsavedChanges: Story = {
	render: () => {
		const [open, setOpen] = useState(false);
		return (
			<>
				<Button onClick={() => setOpen(true)}>Leave Page</Button>
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Unsaved Changes</DialogTitle>
							<DialogDescription>You have unsaved changes. Are you sure you want to leave?</DialogDescription>
						</DialogHeader>
						<DialogFooter className="p-6 pt-0">
							<Button variant="subtle" onClick={() => setOpen(false)}>
								Stay
							</Button>
							<Button variant="danger" onClick={() => setOpen(false)}>
								Leave
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</>
		);
	},
};

export const FormDialog: Story = {
	render: () => {
		const [open, setOpen] = useState(false);
		return (
			<>
				<Button variant="accent" onClick={() => setOpen(true)}>
					Create Quiz
				</Button>
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Create New Quiz</DialogTitle>
							<DialogDescription>Give your quiz a name to get started.</DialogDescription>
						</DialogHeader>
						<div className="p-6 pt-0">
							<div className="flex flex-col gap-2">
								<label htmlFor="quiz-name" className="text-sm font-medium">
									Quiz Name
								</label>
								<input
									id="quiz-name"
									type="text"
									placeholder="Enter quiz name"
									className={`
										flex h-10 w-full rounded-lg border-2 border-black bg-white px-4 py-2
										text-base font-medium
									`}
								/>
							</div>
						</div>
						<DialogFooter className="p-6 pt-0">
							<Button variant="subtle" onClick={() => setOpen(false)}>
								Cancel
							</Button>
							<Button variant="accent" onClick={() => setOpen(false)}>
								Create
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</>
		);
	},
};

export const OpenByDefault: Story = {
	args: {
		open: true,
	},
	render: (dialogProperties) => (
		<Dialog {...dialogProperties}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Welcome!</DialogTitle>
					<DialogDescription>This dialog is open by default for demonstration purposes.</DialogDescription>
				</DialogHeader>
				<DialogFooter className="p-6 pt-0">
					<Button variant="accent">Got it!</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	),
};
