import { AlertDialog as AlertDialogPrimitive } from '@base-ui/react/alert-dialog';
import { type VariantProps } from 'class-variance-authority';
import { AnimatePresence, motion } from 'motion/react';
import * as React from 'react';
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

const AlertDialogContext = createContext<{ open: boolean }>({ open: false });

// ============================================================================
// Types
// ============================================================================

interface AlertDialogProperties {
	readonly children?: React.ReactNode;
	readonly open?: boolean;
	readonly defaultOpen?: boolean;
	readonly onOpenChange?: (open: boolean) => void;
}

interface AlertDialogContentProperties {
	readonly ref?: React.Ref<HTMLDivElement>;
	readonly className?: string;
	readonly children?: React.ReactNode;
	readonly onAnimationEnd?: () => void;
}

interface AlertDialogTitleProperties {
	readonly ref?: React.Ref<HTMLHeadingElement>;
	readonly className?: string;
	readonly children?: React.ReactNode;
}

interface AlertDialogDescriptionProperties {
	readonly ref?: React.Ref<HTMLParagraphElement>;
	readonly className?: string;
	readonly children?: React.ReactNode;
}

interface AlertDialogActionProperties extends VariantProps<typeof buttonVariants> {
	readonly ref?: React.Ref<HTMLButtonElement>;
	readonly className?: string;
	readonly children?: React.ReactNode;
	readonly onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

interface AlertDialogCancelProperties {
	readonly ref?: React.Ref<HTMLButtonElement>;
	readonly className?: string;
	readonly children?: React.ReactNode;
	readonly onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

interface AlertDialogTriggerProperties {
	readonly children?: React.ReactNode;
	readonly className?: string;
	readonly asChild?: boolean;
	readonly ref?: React.Ref<HTMLButtonElement>;
}

// ============================================================================
// Components
// ============================================================================

/** Alert dialog root with controllable open state. */
export function AlertDialog({ children, open: controlledOpen, defaultOpen, onOpenChange, ...properties }: AlertDialogProperties) {
	const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen ?? false);
	const actionsReference = useRef<AlertDialogPrimitive.Root.Actions>(null);

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
		<AlertDialogContext.Provider value={{ open }}>
			<AlertDialogPrimitive.Root open={open} onOpenChange={handleOpenChange} actionsRef={actionsReference} {...properties}>
				{children}
			</AlertDialogPrimitive.Root>
		</AlertDialogContext.Provider>
	);
}

/** Button that opens the alert dialog. Supports asChild via render prop. */
export function AlertDialogTrigger({ children, asChild, ref, ...properties }: AlertDialogTriggerProperties) {
	if (asChild && React.isValidElement<Record<string, unknown>>(children)) {
		return <AlertDialogPrimitive.Trigger ref={ref} render={children} {...properties} />;
	}
	return (
		<AlertDialogPrimitive.Trigger ref={ref} {...properties}>
			{children}
		</AlertDialogPrimitive.Trigger>
	);
}

/** Alert dialog content with animated overlay and panel. */
export function AlertDialogContent({ className, children, ref, onAnimationEnd, ...properties }: AlertDialogContentProperties) {
	const { open } = useContext(AlertDialogContext);

	return (
		<AnimatePresence>
			{open && (
				<AlertDialogPrimitive.Portal keepMounted>
					<AlertDialogPrimitive.Backdrop className={OVERLAY_CLASS_NAME} />
					<div
						className="
							fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4
						"
					>
						<AlertDialogPrimitive.Popup
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
						</AlertDialogPrimitive.Popup>
					</div>
				</AlertDialogPrimitive.Portal>
			)}
		</AnimatePresence>
	);
}
AlertDialogContent.displayName = 'AlertDialogContent';

/** Alert dialog header for title and description. */
export function AlertDialogHeader({ className, ...properties }: React.HTMLAttributes<HTMLDivElement>) {
	return (
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
}
AlertDialogHeader.displayName = 'AlertDialogHeader';

/** Alert dialog footer for action buttons. */
export function AlertDialogFooter({ className, ...properties }: React.HTMLAttributes<HTMLDivElement>) {
	return <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)} {...properties} />;
}
AlertDialogFooter.displayName = 'AlertDialogFooter';

/** Alert dialog title text. */
export function AlertDialogTitle({ className, ref, ...properties }: AlertDialogTitleProperties) {
	return <AlertDialogPrimitive.Title ref={ref} className={cn('font-display text-2xl font-bold', className)} {...properties} />;
}
AlertDialogTitle.displayName = 'AlertDialogTitle';

/** Alert dialog description text. */
export function AlertDialogDescription({ className, ref, ...properties }: AlertDialogDescriptionProperties) {
	return <AlertDialogPrimitive.Description ref={ref} className={cn('text-base font-medium text-black', className)} {...properties} />;
}
AlertDialogDescription.displayName = 'AlertDialogDescription';

/** Primary action button for alert dialog. Uses AlertDialog.Close internally. */
export function AlertDialogAction({ className, variant, size, ref, ...properties }: AlertDialogActionProperties) {
	return <AlertDialogPrimitive.Close ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...properties} />;
}
AlertDialogAction.displayName = 'AlertDialogAction';

/** Cancel button for alert dialog. Uses AlertDialog.Close internally. */
export function AlertDialogCancel({ className, ref, ...properties }: AlertDialogCancelProperties) {
	return (
		<AlertDialogPrimitive.Close
			ref={ref}
			className={cn(
				buttonVariants({ variant: 'subtle' }),
				`
					mt-2
					sm:mt-0
				`,
				className,
			)}
			{...properties}
		/>
	);
}
AlertDialogCancel.displayName = 'AlertDialogCancel';
