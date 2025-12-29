import { Music, RefreshCw } from 'lucide-react';

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
				<a
					href="https://github.com/TimoWilhelm/timoot"
					target="_blank"
					rel="noopener noreferrer"
					className="
						inline-flex items-center gap-2 rounded-lg border-2 border-black
						bg-gray-100 px-4 py-2 text-sm font-bold uppercase shadow-brutal-sm
						transition-all
						hover:-translate-y-px hover:bg-yellow-300 hover:shadow-brutal
						active:translate-y-0 active:shadow-none
					"
				>
					<img src="/icons/github-mark.svg" alt="GitHub" className="size-4" />
					Open Source
				</a>
				<button
					onClick={onMusicCreditsClick}
					className="
						inline-flex cursor-pointer items-center gap-2 rounded-lg border-2
						border-black bg-gray-100 px-4 py-2 text-sm font-bold uppercase
						shadow-brutal-sm transition-all
						hover:-translate-y-px hover:bg-quiz-orange hover:text-white
						hover:shadow-brutal
						active:translate-y-0 active:shadow-none
					"
				>
					<Music className="size-4" />
					Music Credits
				</button>
				<button
					onClick={onSyncDevicesClick}
					className="
						inline-flex cursor-pointer items-center gap-2 rounded-lg border-2
						border-black bg-gray-100 px-4 py-2 text-sm font-bold uppercase
						shadow-brutal-sm transition-all
						hover:-translate-y-px hover:bg-blue-400 hover:text-white
						hover:shadow-brutal
						active:translate-y-0 active:shadow-none
					"
				>
					<RefreshCw className="size-4" />
					Sync Devices
				</button>
			</div>
		</footer>
	);
}
