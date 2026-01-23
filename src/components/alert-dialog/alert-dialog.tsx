import { type VariantProps } from 'class-variance-authority';
import { AnimatePresence, motion } from 'motion/react';
import { AlertDialog as AlertDialogPrimitive } from 'radix-ui';
import * as React from 'react';

import { buttonVariants } from '@/components/button';
import { cn } from '@/lib/utilities';

const AlertDialogContext = React.createContext<{ open: boolean }>({ open: false });

interface AlertDialogProperties extends React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Root> {
	children?: React.ReactNode;
}

export function AlertDialog({ children, open: controlledOpen, defaultOpen, onOpenChange, ...properties }: AlertDialogProperties) {
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
		<AlertDialogContext.Provider value={{ open }}>
			<AlertDialogPrimitive.Root open={open} onOpenChange={handleOpenChange} {...properties}>
				{children}
			</AlertDialogPrimitive.Root>
		</AlertDialogContext.Provider>
	);
}

export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

const AlertDialogPortal = AlertDialogPrimitive.Portal;

export function AlertDialogContent({
	className,
	children,
	ref,
	...properties
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content> & {
	ref?: React.Ref<React.ComponentRef<typeof AlertDialogPrimitive.Content>>;
}) {
	const { open } = React.useContext(AlertDialogContext);

	return (
		<AnimatePresence>
			{open && (
				<AlertDialogPortal forceMount>
					<AlertDialogPrimitive.Overlay
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
						<AlertDialogPrimitive.Content ref={ref} forceMount asChild {...properties}>
							<motion.div
								className={cn(
									`
										relative grid w-full max-w-[calc(100vw-2rem)] gap-4 rounded-xl
										border-4 border-black bg-white p-6
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
						</AlertDialogPrimitive.Content>
					</div>
				</AlertDialogPortal>
			)}
		</AnimatePresence>
	);
}
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;

export const AlertDialogHeader = ({ className, ...properties }: React.HTMLAttributes<HTMLDivElement>) => (
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

export const AlertDialogFooter = ({ className, ...properties }: React.HTMLAttributes<HTMLDivElement>) => (
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

export function AlertDialogTitle({
	className,
	ref,
	...properties
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title> & {
	ref?: React.Ref<React.ComponentRef<typeof AlertDialogPrimitive.Title>>;
}) {
	return <AlertDialogPrimitive.Title ref={ref} className={cn(`font-display text-2xl font-bold`, className)} {...properties} />;
}
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;

export function AlertDialogDescription({
	className,
	ref,
	...properties
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description> & {
	ref?: React.Ref<React.ComponentRef<typeof AlertDialogPrimitive.Description>>;
}) {
	return <AlertDialogPrimitive.Description ref={ref} className={cn(`text-base font-medium text-black`, className)} {...properties} />;
}
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName;

export function AlertDialogAction({
	className,
	variant,
	size,
	ref,
	...properties
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action> &
	VariantProps<typeof buttonVariants> & {
		ref?: React.Ref<React.ComponentRef<typeof AlertDialogPrimitive.Action>>;
	}) {
	return <AlertDialogPrimitive.Action ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...properties} />;
}
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;

export function AlertDialogCancel({
	className,
	ref,
	...properties
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel> & {
	ref?: React.Ref<React.ComponentRef<typeof AlertDialogPrimitive.Cancel>>;
}) {
	return (
		<AlertDialogPrimitive.Cancel
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
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;
