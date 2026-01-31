import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { createContext, useCallback, useContext, useState } from 'react';

import { buttonVariants } from '@/components/button';
import { cn } from '@/lib/utilities';

// ============================================================================
// Constants
// ============================================================================

const OVERLAY_CLASS_NAME = `
	fixed inset-0 z-50 bg-black/50 backdrop-blur-xs
	data-[state=closed]:animate-overlay-out
	data-[state=open]:animate-overlay-in
`;

const CONTENT_CLASS_NAME = `
	relative grid w-full max-w-[calc(100vw-2rem)] gap-4 rounded-xl
	border-4 border-black bg-white p-6
	sm:max-w-lg
`;

const MOTION_VARIANTS = {
	initial: { opacity: 0, scale: 0.9 },
	animate: { opacity: 1, scale: 1 },
	exit: { opacity: 0, scale: 0.95 },
	transition: { duration: 0.15, ease: [0.34, 1.56, 0.64, 1] as const },
} as const;

// ============================================================================
// Context
// ============================================================================

const DialogContext = createContext<{ open: boolean }>({ open: false });

// ============================================================================
// Types
// ============================================================================

interface DialogProperties extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root> {
	readonly children?: React.ReactNode;
}

interface DialogContentProperties extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
	readonly ref?: React.Ref<React.ComponentRef<typeof DialogPrimitive.Content>>;
	readonly onAnimationEnd?: () => void;
}

interface DialogTitleProperties extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title> {
	readonly ref?: React.Ref<React.ComponentRef<typeof DialogPrimitive.Title>>;
}

interface DialogDescriptionProperties extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description> {
	readonly ref?: React.Ref<React.ComponentRef<typeof DialogPrimitive.Description>>;
}

// ============================================================================
// Components
// ============================================================================

/** Dialog root with controllable open state. */
export function Dialog({ children, open: controlledOpen, defaultOpen, onOpenChange, ...properties }: DialogProperties) {
	const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen ?? false);

	const isControlled = controlledOpen !== undefined;
	const open = isControlled ? controlledOpen : uncontrolledOpen;

	const handleOpenChange = useCallback(
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

/** Button that opens the dialog. */
export const DialogTrigger = DialogPrimitive.Trigger;

/** Dialog content with animated overlay and panel. */
export function DialogContent({ className, children, ref, onAnimationEnd, ...properties }: DialogContentProperties) {
	const { open } = useContext(DialogContext);

	return (
		<AnimatePresence>
			{open && (
				<DialogPrimitive.Portal forceMount>
					<DialogPrimitive.Overlay forceMount className={OVERLAY_CLASS_NAME} />
					<div
						className="
							fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4
						"
					>
						<DialogPrimitive.Content ref={ref} forceMount asChild {...properties}>
							<motion.div
								className={cn(CONTENT_CLASS_NAME, className)}
								initial={MOTION_VARIANTS.initial}
								animate={MOTION_VARIANTS.animate}
								exit={MOTION_VARIANTS.exit}
								transition={MOTION_VARIANTS.transition}
								onAnimationComplete={() => !open && onAnimationEnd?.()}
							>
								{children}
							</motion.div>
						</DialogPrimitive.Content>
					</div>
				</DialogPrimitive.Portal>
			)}
		</AnimatePresence>
	);
}
DialogContent.displayName = DialogPrimitive.Content.displayName;

/** Dialog header with title area and close button. */
export function DialogHeader({ className, children, ...properties }: React.HTMLAttributes<HTMLDivElement>) {
	return (
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
}
DialogHeader.displayName = 'DialogHeader';

/** Dialog footer for action buttons. */
export function DialogFooter({ className, ...properties }: React.HTMLAttributes<HTMLDivElement>) {
	return <div className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...properties} />;
}
DialogFooter.displayName = 'DialogFooter';

/** Dialog title text. */
export function DialogTitle({ className, ref, ...properties }: DialogTitleProperties) {
	return (
		<DialogPrimitive.Title
			ref={ref}
			className={cn('font-display text-2xl leading-none font-bold tracking-tight', className)}
			{...properties}
		/>
	);
}
DialogTitle.displayName = DialogPrimitive.Title.displayName;

/** Dialog description text. */
export function DialogDescription({ className, ref, ...properties }: DialogDescriptionProperties) {
	return <DialogPrimitive.Description ref={ref} className={cn('text-sm text-muted-foreground', className)} {...properties} />;
}
DialogDescription.displayName = DialogPrimitive.Description.displayName;
