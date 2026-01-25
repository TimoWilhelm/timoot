import { X } from 'lucide-react';
import { toast as sonnerToast } from 'sonner';

import { Button } from '../button/button';

export const toast = {
	custom: (title: string, options?: { description?: string }) => {
		sonnerToast.custom((t) => (
			<div
				className="
					flex w-full min-w-80 flex-col gap-2 rounded-lg border-2 border-black
					bg-white p-5 font-sans shadow-brutal select-none
				"
			>
				<div className="flex items-start justify-between gap-4">
					<div className="flex flex-col gap-1">
						<h3 className="text-lg/tight font-bold text-black">{title}</h3>
						{options?.description && <p className="text-sm/snug text-muted-foreground">{options.description}</p>}
					</div>
					<Button variant="default" size="icon" className="size-8 shrink-0 rounded-md" onClick={() => sonnerToast.dismiss(t)}>
						<X className="size-4" />
					</Button>
				</div>
			</div>
		));
	},
	success: (title: string, options?: { description?: string }) => {
		sonnerToast.custom((t) => (
			<div
				className="
					flex w-full min-w-80 flex-col gap-2 rounded-lg border-2 border-black
					bg-green-light p-5 font-sans shadow-brutal select-none
				"
			>
				<div className="flex items-start justify-between gap-4">
					<div className="flex flex-col gap-1">
						<h3 className="text-lg/tight font-bold text-green-dark">{title}</h3>
						{options?.description && <p className="text-sm/snug text-green-dark">{options.description}</p>}
					</div>
					<Button variant="default" size="icon" className="size-8 shrink-0 rounded-md" onClick={() => sonnerToast.dismiss(t)}>
						<X className="size-4" />
					</Button>
				</div>
			</div>
		));
	},
	error: (title: string, options?: { description?: string }) => {
		sonnerToast.custom((t) => (
			<div
				className="
					flex w-full min-w-80 flex-col gap-2 rounded-lg border-2 border-black
					bg-red-light p-5 font-sans shadow-brutal select-none
				"
			>
				<div className="flex items-start justify-between gap-4">
					<div className="flex flex-col gap-1">
						<h3 className="text-lg/tight font-bold text-red-dark">{title}</h3>
						{options?.description && <p className="text-sm/snug text-red-dark">{options.description}</p>}
					</div>
					<Button variant="default" size="icon" className="size-8 shrink-0 rounded-md" onClick={() => sonnerToast.dismiss(t)}>
						<X className="size-4" />
					</Button>
				</div>
			</div>
		));
	},
	info: (title: string, options?: { description?: string }) => {
		sonnerToast.custom((t) => (
			<div
				className="
					flex w-full min-w-80 flex-col gap-2 rounded-lg border-2 border-black
					bg-blue-light p-5 font-sans shadow-brutal select-none
				"
			>
				<div className="flex items-start justify-between gap-4">
					<div className="flex flex-col gap-1">
						<h3 className="text-lg/tight font-bold text-blue-dark">{title}</h3>
						{options?.description && <p className="text-sm/snug text-blue-dark">{options.description}</p>}
					</div>
					<Button variant="default" size="icon" className="size-8 shrink-0 rounded-md" onClick={() => sonnerToast.dismiss(t)}>
						<X className="size-4" />
					</Button>
				</div>
			</div>
		));
	},
	warning: (title: string, options?: { description?: string }) => {
		sonnerToast.custom((t) => (
			<div
				className="
					flex w-full min-w-80 flex-col gap-2 rounded-lg border-2 border-black
					bg-yellow-light p-5 font-sans shadow-brutal select-none
				"
			>
				<div className="flex items-start justify-between gap-4">
					<div className="flex flex-col gap-1">
						<h3 className="text-lg/tight font-bold text-yellow-dark">{title}</h3>
						{options?.description && <p className="text-sm/snug text-yellow-dark">{options.description}</p>}
					</div>
					<Button variant="default" size="icon" className="size-8 shrink-0 rounded-md" onClick={() => sonnerToast.dismiss(t)}>
						<X className="size-4" />
					</Button>
				</div>
			</div>
		));
	},
};
