import { Gamepad2, Loader2 } from 'lucide-react';
import { ModalManager, shadcnUiDialog, shadcnUiDialogContent, useModal } from 'shadcn-modal-manager';
import { toast } from 'sonner';

import { Button } from '@/components/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/dialog';
import { useViewTransitionNavigate } from '@/hooks/ui/use-view-transition-navigate';
import { useCreateGame } from '@/hooks/use-api';
import { useUserId } from '@/hooks/use-user-id';
import { useTurnstile } from '@/hooks/utils/use-turnstile';
import { useHostStore } from '@/lib/stores/host-store';

import type { Quiz } from '@shared/types';

type StartGameDialogProperties = {
	selectedQuiz: Quiz;
};

export const StartGameDialog = ModalManager.create<StartGameDialogProperties>(({ selectedQuiz }) => {
	const modal = useModal();
	const navigate = useViewTransitionNavigate();
	const addSecret = useHostStore((s) => s.addSecret);
	const { token: turnstileToken, resetToken, TurnstileWidget } = useTurnstile();
	const { userId } = useUserId();

	const createGameMutation = useCreateGame();
	const isGameStarting = createGameMutation.isPending;

	const handleStartGame = async () => {
		if (isGameStarting) return;
		if (!turnstileToken) {
			toast.error('Please complete the captcha verification first');
			return;
		}

		createGameMutation.mutate(
			{
				header: { 'x-user-id': userId, 'x-turnstile-token': turnstileToken },
				json: { quizId: selectedQuiz.id },
			},
			{
				onSuccess: (result) => {
					if (result.success && result.data) {
						if ('error' in result.data && typeof result.data.error === 'string') {
							toast.error(result.data.error);
							return;
						}
						if (result.data.id && result.data.hostSecret) {
							addSecret(result.data.id, result.data.hostSecret);
							modal.close();
							navigate(`/host/${result.data.id}`);
						} else {
							toast.error('Game created, but missing ID or secret.');
						}
					} else {
						toast.error('error' in result ? String(result.error) : 'Failed to create game');
					}
				},
				onError: (error) => {
					console.error(error);
					toast.error(error.message || 'Could not start a new game. Please try again.');
					resetToken();
				},
			},
		);
	};

	return (
		<Dialog {...shadcnUiDialog(modal)}>
			<DialogContent
				{...shadcnUiDialogContent(modal)}
				onInteractOutside={(event) => {
					if (isGameStarting) event.preventDefault();
				}}
				className="
					overflow-hidden border-4 border-black p-0
					sm:max-w-106.25
				"
			>
				<div className="bg-yellow p-6">
					<DialogHeader>
						<DialogTitle
							className="
								font-display text-3xl font-black tracking-tight whitespace-nowrap
								text-black uppercase
							"
						>
							Start Game?
						</DialogTitle>
						<DialogDescription className="sr-only">
							Start a new game with the selected quiz. You will be redirected to the host screen.
						</DialogDescription>
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
							onClick={handleStartGame}
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
});
