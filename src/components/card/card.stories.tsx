import { Button } from '@/components/button';

import { Card, CardContent, CardHeader, CardTitle } from './card';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
	title: 'Components/Card',
	component: Card,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<Card className="w-80">
			<CardHeader>
				<CardTitle>Card Title</CardTitle>
			</CardHeader>
			<CardContent>
				<p>This is some card content that provides more details.</p>
			</CardContent>
		</Card>
	),
};

export const Simple: Story = {
	render: () => (
		<Card className="w-80 p-6">
			<p>A simple card with just content.</p>
		</Card>
	),
};

export const WithAction: Story = {
	render: () => (
		<Card className="w-80">
			<CardHeader>
				<CardTitle>Quiz Ready</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				<p className="text-muted-foreground">Your quiz has been created and is ready to start.</p>
				<Button variant="accent" className="w-full">
					Start Quiz
				</Button>
			</CardContent>
		</Card>
	),
};

export const QuizCard: Story = {
	render: () => (
		<Card
			className={`
				w-80 cursor-pointer transition-shadow
				hover:shadow-brutal-lg
			`}
		>
			<CardHeader>
				<CardTitle>Geography Quiz</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="flex justify-between text-sm text-muted-foreground">
					<span>10 questions</span>
					<span>Created today</span>
				</div>
			</CardContent>
		</Card>
	),
};

export const PlayerCard: Story = {
	render: () => (
		<Card className="w-40 p-3 text-center">
			<span className="text-lg font-bold">Alice</span>
		</Card>
	),
};

export const Grid: Story = {
	render: () => (
		<div className="grid w-100 grid-cols-2 gap-4">
			<Card className="p-4">
				<CardTitle className="text-base">Quiz 1</CardTitle>
				<p className="mt-1 text-sm text-muted-foreground">5 questions</p>
			</Card>
			<Card className="p-4">
				<CardTitle className="text-base">Quiz 2</CardTitle>
				<p className="mt-1 text-sm text-muted-foreground">10 questions</p>
			</Card>
			<Card className="p-4">
				<CardTitle className="text-base">Quiz 3</CardTitle>
				<p className="mt-1 text-sm text-muted-foreground">8 questions</p>
			</Card>
			<Card className="p-4">
				<CardTitle className="text-base">Quiz 4</CardTitle>
				<p className="mt-1 text-sm text-muted-foreground">12 questions</p>
			</Card>
		</div>
	),
};
