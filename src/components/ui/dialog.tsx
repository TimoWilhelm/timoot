import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import { cn } from '@/lib/utilities';
import { useDialogBackHandler } from '@/hooks/use-dialog-back-handler';

interface DialogProperties extends React.ComponentProps<typeof DialogPrimitive.Root> {
	/** Disable browser back button closing this dialog (use for navigation confirmation dialogs) */
	preventBackClose?: boolean;
}

const Dialog = ({ open, onOpenChange, preventBackClose, ...properties }: DialogProperties) => {
	const { wrappedOnOpenChange } = useDialogBackHandler(preventBackClose ? undefined : open, preventBackClose ? undefined : onOpenChange);

	return <DialogPrimitive.Root open={open} onOpenChange={preventBackClose ? onOpenChange : wrappedOnOpenChange} {...properties} />;
};

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogOverlay = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Overlay>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...properties }, reference) => (
	<DialogPrimitive.Overlay
		ref={reference}
		className={cn(
			'fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
			className,
		)}
		{...properties}
	/>
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...properties }, reference) => (
	<DialogPortal>
		<DialogOverlay>
			<div className="flex h-dvh items-center justify-center overflow-y-auto p-4 transition-[height] duration-200 ease-out">
				<DialogPrimitive.Content
					ref={reference}
					className={cn(
						'relative z-50 grid w-full max-w-[calc(100vw-2rem)] gap-4 rounded-lg border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:max-w-lg',
						className,
					)}
					{...properties}
				>
					{children}
					<DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
						<X className="h-4 w-4" />
						<span className="sr-only">Close</span>
					</DialogPrimitive.Close>
				</DialogPrimitive.Content>
			</div>
		</DialogOverlay>
	</DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...properties }: React.HTMLAttributes<HTMLDivElement>) => (
	<div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...properties} />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({ className, ...properties }: React.HTMLAttributes<HTMLDivElement>) => (
	<div className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...properties} />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Title>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...properties }, reference) => (
	<DialogPrimitive.Title ref={reference} className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...properties} />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Description>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...properties }, reference) => (
	<DialogPrimitive.Description ref={reference} className={cn('text-sm text-muted-foreground', className)} {...properties} />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription };
