import { type VariantProps } from 'class-variance-authority';
import { AlertDialog as AlertDialogPrimitive } from 'radix-ui';
import * as React from 'react';

import { buttonVariants } from '@/components/button';
import { cn } from '@/lib/utilities';

const AlertDialog = AlertDialogPrimitive.Root;

const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

const AlertDialogOverlay = React.forwardRef<
	React.ComponentRef<typeof AlertDialogPrimitive.Overlay>,
	React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...properties }, reference) => (
	<AlertDialogPrimitive.Overlay
		className={cn(
			`
				fixed inset-0 z-50 bg-black/80 backdrop-blur-xs
				data-[state=closed]:animate-overlay-out
				data-[state=open]:animate-overlay-in
			`,
			className,
		)}
		{...properties}
		ref={reference}
	/>
));
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;

const AlertDialogContent = React.forwardRef<
	React.ComponentRef<typeof AlertDialogPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...properties }, reference) => (
	<AlertDialogPrimitive.Portal>
		<AlertDialogOverlay>
			<div
				className={`
					flex h-dvh items-center justify-center overflow-y-auto p-4
					transition-[height] duration-200 ease-out
				`}
			>
				<AlertDialogPrimitive.Content
					ref={reference}
					className={cn(
						`
							relative z-50 grid w-full max-w-[calc(100vw-2rem)] gap-4 rounded-xl
							border-4 border-black bg-white p-6 duration-200
							data-[state=closed]:animate-modal-out
							data-[state=open]:animate-modal-in
							sm:max-w-lg
						`,
						className,
					)}
					{...properties}
				/>
			</div>
		</AlertDialogOverlay>
	</AlertDialogPrimitive.Portal>
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
	React.ComponentRef<typeof AlertDialogPrimitive.Title>,
	React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...properties }, reference) => (
	<AlertDialogPrimitive.Title ref={reference} className={cn(`font-display text-2xl font-bold`, className)} {...properties} />
));
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;

const AlertDialogDescription = React.forwardRef<
	React.ComponentRef<typeof AlertDialogPrimitive.Description>,
	React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...properties }, reference) => (
	<AlertDialogPrimitive.Description ref={reference} className={cn(`text-base font-medium text-black`, className)} {...properties} />
));
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName;

const AlertDialogAction = React.forwardRef<
	React.ComponentRef<typeof AlertDialogPrimitive.Action>,
	React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action> & VariantProps<typeof buttonVariants>
>(({ className, variant, size, ...properties }, reference) => (
	<AlertDialogPrimitive.Action ref={reference} className={cn(buttonVariants({ variant, size }), className)} {...properties} />
));
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;

const AlertDialogCancel = React.forwardRef<
	React.ComponentRef<typeof AlertDialogPrimitive.Cancel>,
	React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...properties }, reference) => (
	<AlertDialogPrimitive.Cancel
		ref={reference}
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
