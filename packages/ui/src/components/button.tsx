import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { Predicate } from 'effect'
import * as React from 'react'
import { tv, type VariantProps } from 'tailwind-variants'

const buttonVariants = tv({
  base: "group/button inline-flex shrink-0 items-center justify-center rounded-4xl border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  variants: {
    variant: {
      primary: 'bg-primary text-primary-foreground hover:bg-primary/80',
      secondary:
        'bg-secondary text-secondary-foreground hover:bg-secondary/90 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground',
      outline:
        'border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:bg-transparent dark:hover:bg-input/30',
      'border-primary': 'border-primary text-primary hover:bg-primary/5',
      'border-secondary': 'border-secondary text-secondary hover:bg-secondary/5',
      ghost:
        'hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50',
      destructive:
        'bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40',
      link: 'text-primary underline-offset-4 hover:underline',

      empty: '',
    },
    size: {
      empty: '',

      xl: "h-11 gap-1.5 px-5.5 has-data-[icon=inline-end]:pe-3.5 has-data-[icon=inline-start]:ps-3.5 [&_svg:not([class*='size-'])]:size-4.5",
      lg: "h-10 gap-1.5 px-4 has-data-[icon=inline-end]:pe-3 has-data-[icon=inline-start]:ps-3 [&_svg:not([class*='size-'])]:size-4",
      md: "h-9 gap-1.5 px-3 has-data-[icon=inline-end]:pe-2.5 has-data-[icon=inline-start]:ps-2.5 [&_svg:not([class*='size-'])]:size-3.5",
      sm: "h-8 gap-1 px-3 has-data-[icon=inline-end]:pe-2 has-data-[icon=inline-start]:ps-2 [&_svg:not([class*='size-'])]:size-3",
      xs: "h-7 gap-1 px-2.5 text-xs has-data-[icon=inline-end]:pe-2 has-data-[icon=inline-start]:ps-2 [&_svg:not([class*='size-'])]:size-2.5",

      'icon-xl': "size-12 [&_svg:not([class*='size-'])]:size-5",
      'icon-lg': "size-10 [&_svg:not([class*='size-'])]:size-4",
      'icon-md': "size-8 [&_svg:not([class*='size-'])]:size-3",
      'icon-sm': "size-7 [&_svg:not([class*='size-'])]:size-3",
      'icon-xs': "size-6 [&_svg:not([class*='size-'])]:size-2.5",
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
})

export type ButtonVariantProps = VariantProps<typeof buttonVariants>

export type ButtonProps = ButtonPrimitive.Props & VariantProps<typeof buttonVariants>

function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={state =>
        buttonVariants({
          variant,
          size,
          className: Predicate.isFunction(className) ? className(state) : className,
        })
      }
      {...props}
    />
  )
}

export { Button, buttonVariants }
