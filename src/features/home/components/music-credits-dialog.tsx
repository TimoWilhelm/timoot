import { Music } from 'lucide-react';
import { ModalManager, shadcnUiDialog, shadcnUiDialogContent, useModal } from 'shadcn-modal-manager';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/dialog';
import { musicCredits } from '@/lib/music-credits';

export const MusicCreditsDialog = ModalManager.create(() => {
	const modal = useModal();

	return (
		<Dialog {...shadcnUiDialog(modal)}>
			<DialogContent {...shadcnUiDialogContent(modal)} className="overflow-hidden border-4 border-black p-0 sm:max-w-125">
				<div className="bg-orange p-6">
					<DialogHeader>
						<DialogTitle
							className="
								flex items-center justify-center gap-2 font-display text-2xl font-bold
								whitespace-nowrap uppercase
								sm:justify-start
							"
						>
							<Music className="size-6" />
							Music Credits
						</DialogTitle>
						<DialogDescription className="sr-only">List of music tracks and their licenses used in the game.</DialogDescription>
					</DialogHeader>
				</div>
				<div className="max-h-100 space-y-4 overflow-y-auto p-6">
					{musicCredits.map((credit) => (
						<div
							key={credit.title}
							className="
								rounded-xl border-2 border-black bg-muted p-4 shadow-brutal-sm
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
											cursor-pointer font-bold text-orange underline
											hover:text-black
										"
									>
										{credit.artist}
									</a>
								</p>
								<p className="text-muted-foreground">
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
});
