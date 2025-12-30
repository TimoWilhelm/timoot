import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
	`
		inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg
		border-2 border-black text-sm font-bold whitespace-nowrap transition-all
		duration-200
		focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2
		focus-visible:outline-hidden
		disabled:pointer-events-none disabled:opacity-50
	`,
	{
		variants: {
			variant: {
				default: `
					bg-primary-foreground text-primary shadow-brutal-sm
					hover:-translate-y-px hover:shadow-brutal
					active:translate-y-0 active:shadow-none
				`,
				destructive: `
					bg-red-500 text-primary shadow-brutal-sm
					hover:-translate-y-px hover:bg-red-600 hover:shadow-brutal
					active:translate-y-0 active:shadow-none
				`,
				primary: `
					bg-quiz-orange text-primary shadow-brutal-sm
					hover:-translate-y-px hover:bg-quiz-orange/90 hover:shadow-brutal
					active:translate-y-0 active:shadow-none
				`,
				secondary: `
					bg-primary-foreground text-primary
					hover:-translate-y-px hover:bg-gray-50 hover:shadow-brutal-sm
					active:translate-y-0 active:shadow-none
				`,
				ghost: `
					border-transparent
					hover:border-black hover:bg-gray-100
				`,
				link: `
					border-transparent text-primary underline-offset-4
					hover:underline
				`,
			},
			size: {
				default: 'h-10 px-4 py-2',
				sm: 'h-8 rounded-md px-3 py-1 text-xs',
				lg: 'h-12 rounded-xl px-8 py-3 text-base',
				icon: 'size-10 p-0',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
);
