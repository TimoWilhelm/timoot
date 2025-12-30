import { Music } from 'lucide-react';
import { musicCredits } from '@shared/music-credits';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface MusicCreditsDialogProperties {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function MusicCreditsDialog({ open, onOpenChange }: MusicCreditsDialogProperties) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="overflow-hidden border-4 border-black p-0 sm:max-w-[500px]">
				<div className="bg-quiz-orange p-6 text-white">
					<DialogHeader>
						<DialogTitle
							className="
								flex items-center gap-2 font-display text-2xl font-bold uppercase
							"
						>
							<Music className="size-6" />
							Music Credits
						</DialogTitle>
					</DialogHeader>
				</div>
				<div className="max-h-[400px] space-y-4 overflow-y-auto p-6">
					{musicCredits.map((credit) => (
						<div
							key={credit.title}
							className="
								rounded-xl border-2 border-black bg-gray-50 p-4 shadow-brutal-sm
							"
						>
							<p className="mb-1 font-display text-lg font-bold">"{credit.title}"</p>
							<div className="space-y-1 text-sm">
								<p>
									By:{' '}
									<a
										href={credit.artistUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="
											cursor-pointer font-bold text-quiz-orange underline
											hover:text-black
										"
									>
										{credit.artist}
									</a>
								</p>
								<p className="text-gray-500">
									License:{' '}
									<a
										href={credit.licenseUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="
											cursor-pointer underline
											hover:text-black
										"
									>
										{credit.license}
									</a>
								</p>
							</div>
						</div>
					))}
				</div>
			</DialogContent>
		</Dialog>
	);
}
