import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import * as React from 'react';

import { buttonVariants } from '@/components/button';
import { cn } from '@/lib/utilities';

const DialogContext = React.createContext<{ open: boolean }>({ open: false });

interface DialogProperties extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root> {
	children?: React.ReactNode;
}

export function Dialog({ children, open: controlledOpen, defaultOpen, onOpenChange, ...properties }: DialogProperties) {
	const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen ?? false);

	const isControlled = controlledOpen !== undefined;
	const open = isControlled ? controlledOpen : uncontrolledOpen;

	const handleOpenChange = React.useCallback(
		(nextOpen: boolean) => {
			if (!isControlled) {
				setUncontrolledOpen(nextOpen);
			}
			onOpenChange?.(nextOpen);
		},
		[isControlled, onOpenChange],
	);

	return (
		<DialogContext.Provider value={{ open }}>
			<DialogPrimitive.Root open={open} onOpenChange={handleOpenChange} {...properties}>
				{children}
			</DialogPrimitive.Root>
		</DialogContext.Provider>
	);
}

export const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

export function DialogContent({
	className,
	children,
	ref,
	...properties
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
	ref?: React.Ref<React.ComponentRef<typeof DialogPrimitive.Content>>;
}) {
	const { open } = React.useContext(DialogContext);

	return (
		<AnimatePresence>
			{open && (
				<DialogPortal forceMount>
					<DialogPrimitive.Overlay
						forceMount
						className={`
							fixed inset-0 z-50 bg-black/50 backdrop-blur-xs
							data-[state=closed]:animate-overlay-out
							data-[state=open]:animate-overlay-in
						`}
					/>
					<div
						className={`
							fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4
						`}
					>
						<DialogPrimitive.Content ref={ref} forceMount asChild {...properties}>
							<motion.div
								className={cn(
									`
										relative grid w-full max-w-[calc(100vw-2rem)] gap-4 rounded-xl
										border-4 border-black bg-white p-0
										sm:max-w-lg
									`,
									className,
								)}
								initial={{ opacity: 0, scale: 0.9 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.95 }}
								transition={{ duration: 0.15, ease: [0.34, 1.56, 0.64, 1] }}
							>
								{children}
							</motion.div>
						</DialogPrimitive.Content>
					</div>
				</DialogPortal>
			)}
		</AnimatePresence>
	);
}
DialogContent.displayName = DialogPrimitive.Content.displayName;

export const DialogHeader = ({ className, children, ...properties }: React.HTMLAttributes<HTMLDivElement>) => (
	<div className={cn('flex flex-row items-start justify-between gap-4', className)} {...properties}>
		<div
			className="
				flex flex-1 flex-col space-y-1.5 text-center
				sm:text-left
			"
		>
			{children}
		</div>
		<DialogPrimitive.Close className={cn(buttonVariants({ variant: 'subtle', size: 'icon' }), 'shrink-0')}>
			<X className="size-4" />
			<span className="sr-only">Close</span>
		</DialogPrimitive.Close>
	</div>
);
DialogHeader.displayName = 'DialogHeader';

export const DialogFooter = ({ className, ...properties }: React.HTMLAttributes<HTMLDivElement>) => (
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

export function DialogTitle({
	className,
	ref,
	...properties
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title> & {
	ref?: React.Ref<React.ComponentRef<typeof DialogPrimitive.Title>>;
}) {
	return (
		<DialogPrimitive.Title
			ref={ref}
			className={cn(`font-display text-2xl leading-none font-bold tracking-tight`, className)}
			{...properties}
		/>
	);
}
DialogTitle.displayName = DialogPrimitive.Title.displayName;

export function DialogDescription({
	className,
	ref,
	...properties
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description> & {
	ref?: React.Ref<React.ComponentRef<typeof DialogPrimitive.Description>>;
}) {
	return <DialogPrimitive.Description ref={ref} className={cn(`text-sm text-muted-foreground`, className)} {...properties} />;
}
DialogDescription.displayName = DialogPrimitive.Description.displayName;
