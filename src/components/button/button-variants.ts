import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
	`
		inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg
		border-2 border-black text-sm font-bold whitespace-nowrap
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
					active:translate-y-px active:shadow-none
				`,
				accent: `
					bg-orange text-primary shadow-brutal-sm
					hover:-translate-y-px hover:bg-orange/90 hover:shadow-brutal
					active:translate-y-px active:shadow-none
				`,
				danger: `
					bg-red text-primary shadow-brutal-sm
					hover:-translate-y-px hover:bg-red/90 hover:shadow-brutal
					active:translate-y-px active:shadow-none
				`,
				subtle: `
					bg-primary-foreground text-primary
					hover:-translate-y-px hover:bg-muted hover:shadow-brutal-sm
					active:translate-y-px active:shadow-none
				`,
				ghost: `
					border-transparent
					hover:border-black hover:bg-muted
				`,
				link: `
					border-transparent text-primary underline-offset-4
					hover:underline
				`,
				// Dark variants for use on dark backgrounds (player pages)
				'dark-default': `
					border-slate bg-white text-black shadow-brutal-sm-slate
					hover:-translate-y-px hover:shadow-brutal-slate
					active:translate-y-px active:shadow-none
				`,
				'dark-accent': `
					border-4 border-orange-dark bg-orange text-white shadow-brutal-slate
					hover:-translate-y-px hover:shadow-brutal-lg-slate
					active:translate-y-px active:shadow-none
				`,
				'dark-subtle': `
					border-slate bg-slate/50 text-white shadow-brutal-sm-slate
					hover:-translate-y-px hover:bg-slate/80 hover:shadow-brutal-slate
					active:translate-y-px active:shadow-none
				`,
				'dark-ghost': `
					border-transparent text-white
					hover:border-slate hover:bg-slate/30
				`,
			},
			size: {
				default: 'h-10 px-4 py-2',
				sm: 'h-8 rounded-md px-3 py-1 text-xs',
				lg: 'h-12 rounded-xl px-8 py-3 text-base',
				xl: 'h-14 rounded-xl px-8 py-4 text-xl font-black uppercase',
				icon: 'size-10 p-0',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
);
