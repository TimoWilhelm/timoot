import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
	`
		inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg
		border-2 border-black text-sm font-bold whitespace-nowrap transition-all
		duration-50
		focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2
		focus-visible:outline-hidden
		disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none
	`,
	{
		variants: {
			variant: {
				default: `
					bg-primary-foreground text-primary shadow-brutal-sm
					hover:-translate-y-0.5 hover:shadow-brutal
					active:translate-y-0.5 active:shadow-brutal-inset
				`,
				accent: `
					bg-orange text-primary shadow-brutal-sm
					hover:-translate-y-0.5 hover:bg-orange/90 hover:shadow-brutal
					active:translate-y-0.5 active:shadow-brutal-inset
				`,
				danger: `
					bg-red text-primary shadow-brutal-sm
					hover:-translate-y-0.5 hover:bg-red/90 hover:shadow-brutal
					active:translate-y-0.5 active:shadow-brutal-inset
				`,
				subtle: `
					bg-primary-foreground text-primary
					hover:-translate-y-0.5 hover:bg-muted hover:shadow-brutal-sm
					active:translate-y-0.5 active:shadow-brutal-inset
				`,
				ghost: `
					border-transparent
					hover:border-black hover:bg-muted
					active:translate-y-0.5 active:shadow-brutal-inset
				`,
				link: `
					border-transparent underline-slide text-primary transition-none
					[transition:background-size_0.3s]
				`,
				// Dark variants for use on dark backgrounds (player pages)
				'dark-default': `
					border-slate bg-white text-black shadow-brutal-sm-slate
					hover:-translate-y-0.5 hover:shadow-brutal-slate
					active:translate-y-0.5 active:shadow-brutal-inset
				`,
				'dark-accent': `
					border-4 border-orange-dark bg-orange text-white shadow-brutal-slate
					hover:-translate-y-1 hover:shadow-brutal-lg-slate
					active:translate-y-1 active:shadow-brutal-inset
				`,
				'dark-subtle': `
					border-slate bg-slate/50 text-white shadow-brutal-sm-slate
					hover:-translate-y-0.5 hover:bg-slate/80 hover:shadow-brutal-slate
					active:translate-y-0.5 active:shadow-brutal-inset
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
		compoundVariants: [
			{
				variant: ['default', 'accent', 'danger'],
				size: 'lg',
				class: `
					shadow-brutal
					hover:-translate-y-1 hover:shadow-brutal-lg
					active:translate-y-1 active:shadow-brutal-inset
				`,
			},
			{
				variant: 'subtle',
				size: 'lg',
				class: `
					hover:-translate-y-1 hover:shadow-brutal
					active:translate-y-1 active:shadow-brutal-inset
				`,
			},
			{
				variant: 'dark-default',
				size: 'lg',
				class: `
					shadow-brutal-slate
					hover:-translate-y-1 hover:shadow-brutal-lg-slate
					active:translate-y-1 active:shadow-brutal-inset
				`,
			},
			{
				variant: 'dark-accent',
				size: 'lg',
				class: `
					shadow-brutal-slate
					hover:-translate-y-1 hover:shadow-brutal-lg-slate
					active:translate-y-1 active:shadow-brutal-inset
				`,
			},
			{
				variant: ['default', 'accent', 'danger'],
				size: 'xl',
				class: `
					shadow-brutal
					hover:-translate-y-1 hover:shadow-brutal-lg
					active:translate-y-1 active:shadow-brutal-inset
				`,
			},
			{
				variant: 'subtle',
				size: 'xl',
				class: `
					hover:-translate-y-1 hover:shadow-brutal
					active:translate-y-1 active:shadow-brutal-inset
				`,
			},
			{
				variant: 'dark-default',
				size: 'xl',
				class: `
					shadow-brutal-slate
					hover:-translate-y-1 hover:shadow-brutal-lg-slate
					active:translate-y-1 active:shadow-brutal-inset
				`,
			},
			{
				variant: 'dark-accent',
				size: 'xl',
				class: `
					shadow-brutal-slate
					hover:-translate-y-1 hover:shadow-brutal-lg-slate
					active:translate-y-1 active:shadow-brutal-inset
				`,
			},
			// Link variant should have no padding/height - it's inline text
			{
				variant: 'link',
				class: 'h-auto p-0',
			},
		],
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
);
