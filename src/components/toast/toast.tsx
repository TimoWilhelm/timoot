import { X } from 'lucide-react';
import { toast as sonnerToast } from 'sonner';

import { cn } from '@/lib/utilities';

import { Button } from '../button/button';

interface ToastOptions {
	description?: string;
	action?: { label: string; onClick: () => void };
}

type ToastTone = 'custom' | 'success' | 'error' | 'info' | 'warning';

const toastToneClasses: Record<ToastTone, { container: string; title: string; description: string }> = {
	custom: { container: 'bg-white', title: 'text-black', description: 'text-muted-foreground' },
	success: { container: 'bg-green-light', title: 'text-green-dark', description: 'text-green-dark' },
	error: { container: 'bg-red-light', title: 'text-red-dark', description: 'text-red-dark' },
	info: { container: 'bg-blue-light', title: 'text-blue-dark', description: 'text-blue-dark' },
	warning: { container: 'bg-yellow-light', title: 'text-yellow-dark', description: 'text-yellow-dark' },
};

function showToast(tone: ToastTone, title: string, options?: ToastOptions) {
	const toneClasses = toastToneClasses[tone];

	sonnerToast.custom((toastId) => (
		<div
			className={cn(
				`
					flex w-full min-w-80 flex-col gap-2 rounded-lg border-2 border-black p-5
					font-sans shadow-brutal select-none
				`,
				toneClasses.container,
			)}
		>
			<div className="flex items-start justify-between gap-4">
				<div className="flex flex-col gap-1">
					<h3 className={cn('text-lg/tight font-bold', toneClasses.title)}>{title}</h3>
					{options?.description && <p className={cn('text-sm/snug', toneClasses.description)}>{options.description}</p>}
				</div>
				<Button
					variant="ghost"
					size="icon"
					className="size-10 shrink-0 rounded-md"
					onClick={() => sonnerToast.dismiss(toastId)}
					aria-label="Dismiss notification"
				>
					<X className="size-5" />
				</Button>
			</div>
			{options?.action && (
				<Button
					variant="default"
					size="sm"
					onClick={() => {
						try {
							options.action?.onClick();
						} finally {
							sonnerToast.dismiss(toastId);
						}
					}}
				>
					{options.action.label}
				</Button>
			)}
		</div>
	));
}

export const toast = {
	custom: (title: string, options?: ToastOptions) => showToast('custom', title, options),
	success: (title: string, options?: ToastOptions) => showToast('success', title, options),
	error: (title: string, options?: ToastOptions) => showToast('error', title, options),
	info: (title: string, options?: ToastOptions) => showToast('info', title, options),
	warning: (title: string, options?: ToastOptions) => showToast('warning', title, options),
};
