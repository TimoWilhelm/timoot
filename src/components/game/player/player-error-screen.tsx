import { PlayerPageLayout } from '@/components/game/player/player-page-layout';

interface PlayerErrorScreenProperties {
	emoji: string;
	title: string;
	description: string;
	children: React.ReactNode;
}

export function PlayerErrorScreen({ emoji, title, description, children }: PlayerErrorScreenProperties) {
	return (
		<PlayerPageLayout className="flex flex-col items-center justify-center p-8">
			<div className="relative z-10 flex flex-col items-center">
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
		</PlayerPageLayout>
	);
}
