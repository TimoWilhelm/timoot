import { Gamepad2, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import type { Quiz } from '@shared/types';

interface StartGameDialogProperties {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	selectedQuiz: Quiz | undefined;
	isGameStarting: boolean;
	turnstileToken: string | null;
	TurnstileWidget: React.ComponentType<{ className?: string }>;
	onStartGame: () => void;
}

export function StartGameDialog({
	open,
	onOpenChange,
	selectedQuiz,
	isGameStarting,
	turnstileToken,
	TurnstileWidget,
	onStartGame,
}: StartGameDialogProperties) {
	return (
		<Dialog open={open} onOpenChange={(o) => !isGameStarting && onOpenChange(o)}>
			<DialogContent className="overflow-hidden border-4 border-black p-0 sm:max-w-[425px]">
				<div className="bg-yellow p-6">
					<DialogHeader>
						<DialogTitle
							className="
								font-display text-3xl font-black tracking-tight text-black uppercase
							"
						>
							Start Game?
						</DialogTitle>
					</DialogHeader>
				</div>
				<div className="p-6">
					<div
						className="
							mb-6 rounded-xl border-2 border-black bg-white p-4 shadow-brutal-sm
						"
					>
						<h4
							className="
								mb-2 text-xs font-bold tracking-wider text-muted-foreground uppercase
							"
						>
							Selected Quiz
						</h4>
						<p className="font-display text-xl font-bold">{selectedQuiz?.title}</p>
						<div className="mt-2 flex items-center gap-2 font-mono text-sm">
							<span className="rounded-sm bg-black px-2 py-0.5 text-white">{selectedQuiz?.questions.length} Qs</span>
						</div>
					</div>
					<TurnstileWidget className="mb-4 flex justify-center" />
					<div className="flex gap-3">
						<Button
							onClick={onStartGame}
							disabled={isGameStarting || !turnstileToken}
							variant="accent"
							className="w-full rounded-xl py-6 text-lg"
						>
							{isGameStarting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Gamepad2 className="mr-2 size-4" />}
							Let's Play
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
