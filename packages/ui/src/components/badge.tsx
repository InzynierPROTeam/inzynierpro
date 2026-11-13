import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { tv, type VariantProps } from 'tailwind-variants'

const badgeVariants = tv({
  base: 'group/badge inline-flex w-fit shrink-0 items-center justify-center overflow-hidden rounded-full border font-semibold whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none',
  variants: {
    variant: {
      primary: 'bg-primary text-primary-foreground border-transparent',
      secondary: 'bg-secondary text-secondary-foreground border-transparent',
      accent: 'bg-accent text-accent-foreground border-transparent',
      destructive: 'bg-destructive text-destructive-foreground border-transparent',
      background: 'bg-background text-primary border-transparent',
      outline: 'text-foreground/70 border-border',
      'outline-primary': 'text-primary border-primary',
      'outline-primary-foreground': 'text-primary-foreground border-primary-foreground',
      'outline-secondary': 'text-secondary border-secondary',
      'outline-destructive': 'text-destructive border-destructive',
      'outline-success': 'text-success border-success',
    },
    size: {
      lg: 'px-4 py-1 gap-2 text-sm [&>svg]:size-3.5!',
      md: 'px-3 py-1 gap-2 text-xs [&>svg]:size-3!',
      sm: 'px-2 py-0.5 gap-1 text-xs [&>svg]:size-2.5!',
      xs: 'px-2 py-0.25 gap-1 text-2xs [&>svg]:size-2!',
    },
  },
  defaultVariants: { variant: 'primary', size: 'md' },
})

export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>

type BadgeProps = useRender.ComponentProps<'span'> & VariantProps<typeof badgeVariants>

function Badge({ className, variant = 'primary', size = 'md', render, ...props }: BadgeProps) {
  return useRender({
    defaultTagName: 'span',
    props: mergeProps<'span'>({ className: badgeVariants({ variant, size, className }) }, props),
    render,
    state: { slot: 'badge', variant, size },
  })
}

export { Badge, badgeVariants }
