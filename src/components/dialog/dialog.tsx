import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { createContext, useCallback, useContext, useRef, useState } from 'react';

import { buttonVariants } from '@/components/button';
import { cn } from '@/lib/utilities';

// ============================================================================
// Constants
// ============================================================================

const OVERLAY_CLASS_NAME = `
	fixed inset-0 z-50 bg-black/50 backdrop-blur-xs
	data-[closed]:animate-overlay-out
	data-[open]:animate-overlay-in
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

interface DialogProperties {
	readonly children?: React.ReactNode;
	readonly open?: boolean;
	readonly defaultOpen?: boolean;
	readonly onOpenChange?: (open: boolean) => void;
}

interface DialogContentProperties {
	readonly ref?: React.Ref<HTMLDivElement>;
	readonly className?: string;
	readonly children?: React.ReactNode;
	readonly onAnimationEnd?: () => void;
}

interface DialogTitleProperties {
	readonly ref?: React.Ref<HTMLHeadingElement>;
	readonly className?: string;
	readonly children?: React.ReactNode;
}

interface DialogDescriptionProperties {
	readonly ref?: React.Ref<HTMLParagraphElement>;
	readonly className?: string;
	readonly children?: React.ReactNode;
}

// ============================================================================
// Components
// ============================================================================

/** Dialog root with controllable open state. */
export function Dialog({ children, open: controlledOpen, defaultOpen, onOpenChange, ...properties }: DialogProperties) {
	const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen ?? false);
	const actionsReference = useRef<DialogPrimitive.Root.Actions>(null);

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
			<DialogPrimitive.Root open={open} onOpenChange={handleOpenChange} actionsRef={actionsReference} {...properties}>
				{children}
			</DialogPrimitive.Root>
		</DialogContext.Provider>
	);
}

/** Dialog content with animated overlay and panel. */
export function DialogContent({ className, children, ref, onAnimationEnd, ...properties }: DialogContentProperties) {
	const { open } = useContext(DialogContext);

	return (
		<AnimatePresence>
			{open && (
				<DialogPrimitive.Portal keepMounted>
					<DialogPrimitive.Backdrop className={OVERLAY_CLASS_NAME} />
					<div
						className="
							fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4
						"
					>
						<DialogPrimitive.Popup
							ref={ref}
							render={
								<motion.div
									className={cn(CONTENT_CLASS_NAME, className)}
									initial={MOTION_VARIANTS.initial}
									animate={MOTION_VARIANTS.animate}
									exit={MOTION_VARIANTS.exit}
									transition={MOTION_VARIANTS.transition}
									onAnimationComplete={() => !open && onAnimationEnd?.()}
								/>
							}
							{...properties}
						>
							{children}
						</DialogPrimitive.Popup>
					</div>
				</DialogPrimitive.Portal>
			)}
		</AnimatePresence>
	);
}
DialogContent.displayName = 'DialogContent';

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
DialogTitle.displayName = 'DialogTitle';

/** Dialog description text. */
export function DialogDescription({ className, ref, ...properties }: DialogDescriptionProperties) {
	return <DialogPrimitive.Description ref={ref} className={cn('text-sm text-muted-foreground', className)} {...properties} />;
}
DialogDescription.displayName = 'DialogDescription';
