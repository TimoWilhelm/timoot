import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import { cn } from '@/lib/utilities';
import { buttonVariants } from '@/components/ui/button/button-variants';

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogOverlay = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Overlay>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...properties }, reference) => (
	<DialogPrimitive.Overlay
		ref={reference}
		className={cn(
			`
				fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs
				data-[state=closed]:animate-overlay-out
				data-[state=open]:animate-overlay-in
			`,
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
			<div
				className={`
					flex h-dvh items-center justify-center overflow-y-auto p-4
					transition-[height] duration-200 ease-out
				`}
			>
				<DialogPrimitive.Content
					ref={reference}
					className={cn(
						`
							relative z-50 grid w-full max-w-[calc(100vw-2rem)] gap-4 rounded-xl
							border-4 border-black bg-white p-0 duration-200
							data-[state=closed]:animate-modal-out
							data-[state=open]:animate-modal-in
							sm:max-w-lg
						`,
						className,
					)}
					{...properties}
				>
					{children}
					<DialogPrimitive.Close className={cn(buttonVariants({ variant: 'subtle', size: 'icon' }), 'absolute top-4 right-4 z-10 size-8')}>
						<X className="size-4" />
						<span className="sr-only">Close</span>
					</DialogPrimitive.Close>
				</DialogPrimitive.Content>
			</div>
		</DialogOverlay>
	</DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...properties }: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn(
			`
				flex flex-col space-y-1.5 text-center
				sm:text-left
			`,
			className,
		)}
		{...properties}
	/>
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({ className, ...properties }: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn(
			`
				flex flex-col-reverse gap-2
				sm:flex-row sm:justify-end
			`,
			className,
		)}
		{...properties}
	/>
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Title>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...properties }, reference) => (
	<DialogPrimitive.Title
		ref={reference}
		className={cn(`font-display text-2xl leading-none font-bold tracking-tight`, className)}
		{...properties}
	/>
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Description>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...properties }, reference) => (
	<DialogPrimitive.Description ref={reference} className={cn(`text-sm text-muted-foreground`, className)} {...properties} />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription };
