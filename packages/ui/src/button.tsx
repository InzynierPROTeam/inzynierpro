import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '~ui/utils/styles.js'

export const buttonVariants = cva(
  "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 rounded-full border border-transparent bg-clip-padding cursor-pointer font-semibold focus-visible:ring-3 aria-invalid:ring-3 active:not-aria-[haspopup]:translate-y-px [&_svg:not([class*='size-'])]:size-4 inline-flex items-center justify-center whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none group/button select-none",
  {
    variants: {
      variant: {
        primary: 'border-transparent bg-primary text-primary-foreground [a]:hover:bg-primary/80',
        'primary-foreground':
          'border-transparent bg-primary-foreground text-primary [a]:hover:bg-primary-foreground/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground',
        outline: 'border-border text-foreground hover:bg-primary/3 bg-transparent',
        'outline-primary': 'border-primary text-primary hover:bg-primary/5',
        'outline-accent': 'border-accent text-accent hover:bg-accent/5',
        'outline-secondary': 'border-secondary text-secondary hover:bg-secondary/5',
        background: 'border-border bg-background text-foreground hover:bg-background/80',
        ghost:
          'border-transparent hover:bg-muted hover:text-foreground dark:hover:bg-muted/50 aria-expanded:bg-muted aria-expanded:text-foreground',
        destructive:
          'border-transparent bg-destructive hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 text-destructive-foreground focus-visible:border-destructive/40',
        link: 'border-0 text-primary underline-offset-4 hover:underline',

        blank: '',
      },
      size: {
        bare: '',

        xl: "gap-2.5 px-4 py-2.5 text-lg [&_svg:not([class*='size-'])]:size-5",
        lg: "gap-2 px-4 py-1.5 text-base [&_svg:not([class*='size-'])]:size-4.5",
        md: "gap-1.5 px-3 py-1.25 text-base [&_svg:not([class*='size-'])]:size-4",
        sm: "gap-1 px-2.5 py-1.25 text-sm [&_svg:not([class*='size-'])]:size-3.5",
        xs: "gap-1 px-2 py-1 text-xs [&_svg:not([class*='size-'])]:size-3",

        'icon-xl': "size-12 [&_svg:not([class*='size-'])]:size-6",
        'icon-lg': "size-10 [&_svg:not([class*='size-'])]:size-5",
        'icon-md': "size-8 [&_svg:not([class*='size-'])]:size-4",
        'icon-sm': "size-7 [&_svg:not([class*='size-'])]:size-3.5",
        'icon-xs': "size-6 [&_svg:not([class*='size-'])]:size-3",
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

export type ButtonVariantProps = VariantProps<typeof buttonVariants>

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export function isNativeButtonElement(element: React.ReactElement): boolean {
  return element.type === Button || element.type === 'button'
}
