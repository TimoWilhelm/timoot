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

type DeleteQuizDialogProperties = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
};

export function DeleteQuizDialog({ open, onOpenChange, onConfirm }: DeleteQuizDialogProperties) {
	const handleConfirm = () => {
		onConfirm();
		onOpenChange(false);
	};

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
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
					<AlertDialogCancel className="border-2 border-black font-bold">Cancel</AlertDialogCancel>
					<AlertDialogAction onClick={handleConfirm} variant="danger">
						Yes, Delete it
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
