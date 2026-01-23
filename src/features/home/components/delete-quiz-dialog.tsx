import { ModalManager, shadcnUiDialog, shadcnUiDialogContent, useModal } from 'shadcn-modal-manager';

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/alert-dialog';

export const DeleteQuizDialog = ModalManager.create(() => {
	const modal = useModal();

	const handleConfirm = () => {
		modal.close(true);
	};

	return (
		<AlertDialog {...shadcnUiDialog(modal)}>
			<AlertDialogContent {...shadcnUiDialogContent(modal)}>
				<AlertDialogHeader>
					<AlertDialogTitle
						className="
							font-display text-2xl font-bold whitespace-nowrap text-red uppercase
						"
					>
						Delete Quiz?
					</AlertDialogTitle>
					<AlertDialogDescription className="text-base font-medium text-black">
						This action cannot be undone. This will permanently delete your quiz from our servers.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={modal.dismiss} className="border-2 border-black font-bold">
						Cancel
					</AlertDialogCancel>
					<AlertDialogAction onClick={handleConfirm} variant="danger">
						Yes, Delete it
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
});
