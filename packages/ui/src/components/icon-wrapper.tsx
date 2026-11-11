import * as React from 'react'
import { tv, type VariantProps } from 'tailwind-variants'

const iconWrapperVariants = tv({
  base: 'flex shrink-0 items-center justify-center rounded-full [&_svg]:pointer-events-none [&_svg]:shrink-0',
  variants: {
    size: {
      '2xl': "size-14 [&_svg:not([class*='size-'])]:size-7",
      xl: "size-12 [&_svg:not([class*='size-'])]:size-6",
      lg: "size-10 [&_svg:not([class*='size-'])]:size-5",
      md: "size-9 [&_svg:not([class*='size-'])]:size-4.5",
      sm: "size-8 [&_svg:not([class*='size-'])]:size-4",
      xs: "size-7 [&_svg:not([class*='size-'])]:size-3.5",
      '2xs': "size-6 [&_svg:not([class*='size-'])]:size-3",
    },
    variant: {
      muted: 'bg-muted text-muted-foreground',
      background: 'bg-background text-foreground',
      primary: 'bg-primary text-primary-foreground',
      'primary-foreground-soft': 'bg-primary-foreground/20 text-primary-foreground',
      'primary-soft': 'text-primary bg-current/20',
      secondary: 'bg-secondary text-secondary-foreground',
      'secondary-soft': 'text-secondary bg-current/20',
    },
  },
  defaultVariants: {
    size: 'lg',
    variant: 'muted',
  },
})

type IconWrapperVariantProps = VariantProps<typeof iconWrapperVariants>

type IconWrapperProps = React.ComponentProps<'div'> & IconWrapperVariantProps

function IconWrapper({ className, size, variant, ...props }: IconWrapperProps) {
  return (
    <div
      data-slot="icon-wrapper"
      className={iconWrapperVariants({ size, variant, className })}
      {...props}
    />
  )
}

export { IconWrapper, iconWrapperVariants, type IconWrapperProps, type IconWrapperVariantProps }
