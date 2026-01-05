interface PlayerErrorProperties {
	emoji: string;
	title: string;
	description: string;
	children: React.ReactNode;
}

export function PlayerError({ emoji, title, description, children }: PlayerErrorProperties) {
	return (
		<div className="relative flex flex-col items-center">
			<div className="mb-6 text-6xl">{emoji}</div>
			<h1 className="mb-4 text-center font-display text-3xl font-bold">{title}</h1>
			<p
				className={`
					mb-8 max-w-md text-center text-lg font-medium text-muted-foreground
				`}
			>
				{description}
			</p>
			{children}
		</div>
	);
}
