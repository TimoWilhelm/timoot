import { Music, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HomeFooterProperties {
	onMusicCreditsClick: () => void;
	onSyncDevicesClick: () => void;
}

export function HomeFooter({ onMusicCreditsClick, onSyncDevicesClick }: HomeFooterProperties) {
	return (
		<footer className="relative z-10 border-t-4 border-black bg-white px-4 py-6">
			<div
				className="
					flex flex-col items-center justify-center gap-3
					sm:flex-row sm:gap-6
				"
			>
				<Button
					asChild
					className="
						bg-muted text-sm uppercase shadow-brutal-sm transition-colors duration-75
						hover:bg-yellow
					"
				>
					<a href="https://github.com/TimoWilhelm/timoot" target="_blank" rel="noopener noreferrer">
						<img src="/icons/github-mark.svg" alt="GitHub" className="size-4" />
						Open Source
					</a>
				</Button>
				<Button
					type="button"
					onClick={onMusicCreditsClick}
					className="
						bg-muted text-sm uppercase shadow-brutal-sm transition-colors duration-75
						hover:bg-orange
					"
				>
					<Music className="size-4" />
					Music Credits
				</Button>
				<Button
					type="button"
					onClick={onSyncDevicesClick}
					className="
						bg-muted text-sm uppercase shadow-brutal-sm transition-colors duration-75
						hover:bg-blue
					"
				>
					<RefreshCw className="size-4" />
					Sync Devices
				</Button>
			</div>
		</footer>
	);
}
