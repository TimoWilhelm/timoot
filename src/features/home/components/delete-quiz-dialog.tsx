import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/alert-dialog/alert-dialog';

interface DeleteQuizDialogProperties {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
}

export function DeleteQuizDialog({ open, onOpenChange, onConfirm }: DeleteQuizDialogProperties) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle className="font-display text-2xl font-bold text-red uppercase">Delete Quiz?</AlertDialogTitle>
					<AlertDialogDescription className="text-base font-medium text-black">
						This action cannot be undone. This will permanently delete your quiz from our servers.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel className="border-2 border-black font-bold">Cancel</AlertDialogCancel>
					<AlertDialogAction onClick={onConfirm} variant="danger">
						Yes, Delete it
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
