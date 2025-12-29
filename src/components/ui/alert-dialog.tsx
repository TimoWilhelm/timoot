import * as React from 'react';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';

import { cn } from '@/lib/utilities';
import { buttonVariants } from '@/components/ui/button';
import { useDialogBackHandler } from '@/hooks/use-dialog-back-handler';

interface AlertDialogProperties extends React.ComponentProps<typeof AlertDialogPrimitive.Root> {
	/** Disable browser back button closing this dialog (use for navigation confirmation dialogs) */
	preventBackClose?: boolean;
}

const AlertDialog = ({ open, onOpenChange, preventBackClose, ...properties }: AlertDialogProperties) => {
	const { wrappedOnOpenChange } = useDialogBackHandler(preventBackClose ? undefined : open, preventBackClose ? undefined : onOpenChange);

	return <AlertDialogPrimitive.Root open={open} onOpenChange={preventBackClose ? onOpenChange : wrappedOnOpenChange} {...properties} />;
};

const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

const AlertDialogPortal = AlertDialogPrimitive.Portal;

const AlertDialogOverlay = React.forwardRef<
	React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
	React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...properties }, reference) => (
	<AlertDialogPrimitive.Overlay
		className={cn(
			`
				fixed inset-0 z-50 bg-black/80 backdrop-blur-xs
				data-[state=closed]:animate-out data-[state=closed]:fade-out-0
				data-[state=open]:animate-in data-[state=open]:fade-in-0
			`,
			className,
		)}
		{...properties}
		ref={reference}
	/>
));
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;

const AlertDialogContent = React.forwardRef<
	React.ElementRef<typeof AlertDialogPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...properties }, reference) => (
	<AlertDialogPortal>
		<AlertDialogOverlay />
		<AlertDialogPrimitive.Content
			ref={reference}
			className={cn(
				`
					fixed top-[50%] left-[50%] z-50 grid max-h-[calc(100vh-2rem)] w-full
					max-w-[calc(100vw-2rem)] translate-[-50%] gap-4 overflow-y-auto rounded-lg
					border bg-background p-6 shadow-lg duration-200
					data-[state=closed]:animate-out
					data-[state=closed]:[--tw-exit-translate-x:-50%]
					data-[state=closed]:[--tw-exit-translate-y:-50%]
					data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95
					data-[state=open]:animate-in
					data-[state=open]:[--tw-enter-translate-x:-50%]
					data-[state=open]:[--tw-enter-translate-y:-50%]
					data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95
					sm:max-w-lg
				`,
				className,
			)}
			{...properties}
		/>
	</AlertDialogPortal>
));
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;

const AlertDialogHeader = ({ className, ...properties }: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn(
			`
				flex flex-col space-y-2 text-center
				sm:text-left
			`,
			className,
		)}
		{...properties}
	/>
);
AlertDialogHeader.displayName = 'AlertDialogHeader';

const AlertDialogFooter = ({ className, ...properties }: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn(
			`
				flex flex-col-reverse
				sm:flex-row sm:justify-end sm:space-x-2
			`,
			className,
		)}
		{...properties}
	/>
);
AlertDialogFooter.displayName = 'AlertDialogFooter';

const AlertDialogTitle = React.forwardRef<
	React.ElementRef<typeof AlertDialogPrimitive.Title>,
	React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...properties }, reference) => (
	<AlertDialogPrimitive.Title ref={reference} className={cn(`text-lg font-semibold`, className)} {...properties} />
));
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;

const AlertDialogDescription = React.forwardRef<
	React.ElementRef<typeof AlertDialogPrimitive.Description>,
	React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...properties }, reference) => (
	<AlertDialogPrimitive.Description ref={reference} className={cn(`text-sm text-muted-foreground`, className)} {...properties} />
));
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName;

const AlertDialogAction = React.forwardRef<
	React.ElementRef<typeof AlertDialogPrimitive.Action>,
	React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, ...properties }, reference) => (
	<AlertDialogPrimitive.Action ref={reference} className={cn(buttonVariants(), className)} {...properties} />
));
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;

const AlertDialogCancel = React.forwardRef<
	React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
	React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...properties }, reference) => (
	<AlertDialogPrimitive.Cancel
		ref={reference}
		className={cn(
			buttonVariants({ variant: 'outline' }),
			`
				mt-2
				sm:mt-0
			`,
			className,
		)}
		{...properties}
	/>
));
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;

export {
	AlertDialog,
	AlertDialogTrigger,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogFooter,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogAction,
	AlertDialogCancel,
};
