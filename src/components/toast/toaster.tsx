import { Toaster as Sonner } from 'sonner';

type ToasterProperties = React.ComponentProps<typeof Sonner>;

export function Toaster({ ...properties }: ToasterProperties) {
	return (
		<Sonner
			className="group"
			toastOptions={{
				classNames: {
					toast:
						'group toast group-[.toaster]:bg-white group-[.toaster]:text-black group-[.toaster]:border-2 group-[.toaster]:border-black group-[.toaster]:shadow-brutal group-[.toaster]:rounded-lg group-[.toaster]:p-5 group-[.toaster]:gap-4 group-[.toaster]:flex group-[.toaster]:items-start group-[.toaster]:w-full group-[.toaster]:font-sans',
					title: 'group-[.toast]:font-bold group-[.toast]:text-lg group-[.toast]:text-black group-[.toast]:leading-tight',
					description: 'group-[.toast]:text-muted-foreground group-[.toast]:text-sm group-[.toast]:leading-snug',
					actionButton:
						'group-[.toast]:bg-black group-[.toast]:text-white group-[.toast]:font-bold group-[.toast]:font-sans group-[.toast]:rounded-md group-[.toast]:text-sm group-[.toast]:border-2 group-[.toast]:border-transparent group-[.toast]:transition-transform group-[.toast]:active:translate-y-0.5 group-[.toast]:shadow-brutal-sm hover:group-[.toast]:bg-black/90',
					cancelButton:
						'group-[.toast]:bg-white group-[.toast]:text-black group-[.toast]:border-2 group-[.toast]:border-black group-[.toast]:font-bold group-[.toast]:font-sans group-[.toast]:rounded-md group-[.toast]:text-sm group-[.toast]:transition-transform group-[.toast]:active:translate-y-0.5 group-[.toast]:shadow-brutal-sm hover:group-[.toast]:bg-gray-100',
					closeButton:
						'group-[.toast]:!bg-transparent group-[.toast]:!border-2 group-[.toast]:!border-transparent group-[.toast]:!text-black group-[.toast]:!rounded-md group-[.toast]:!size-10 group-[.toast]:!p-2 group-[.toast]:!opacity-100 group-[.toast]:!right-2 group-[.toast]:!top-2 group-[.toast]:!transition-all group-[.toast]:!shadow-none hover:group-[.toast]:!border-black hover:group-[.toast]:!bg-muted active:group-[.toast]:!translate-y-0.5 active:group-[.toast]:!shadow-brutal-inset focus-visible:group-[.toast]:!ring-2 focus-visible:group-[.toast]:!ring-black focus-visible:group-[.toast]:!ring-offset-2',
					error: 'group-[.toaster]:!bg-red-50 group-[.toaster]:!text-red-900',
					success: 'group-[.toaster]:!bg-green-50 group-[.toaster]:!text-green-900',
					warning: 'group-[.toaster]:!bg-yellow-50 group-[.toaster]:!text-yellow-900',
					info: 'group-[.toaster]:!bg-blue-50 group-[.toaster]:!text-blue-900',
				},
			}}
			{...properties}
		/>
	);
}
