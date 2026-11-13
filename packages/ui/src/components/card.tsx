import * as React from 'react'
import { cn, tv, type VariantProps } from 'tailwind-variants'

const cardVariants = tv({
  base: 'group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-(--card-radius) py-(--card-spacing) text-sm shadow-md ring-1 ring-foreground/5 [--card-spacing:--spacing(6)] [--card-radius:var(--radius-4xl)] has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(4)] data-[size=sm]:[--card-radius:var(--radius-3xl)] data-[size=xs]:[--card-spacing:--spacing(3)] data-[size=xs]:[--card-radius:var(--radius-2xl)] dark:ring-foreground/10 *:[img:first-child]:rounded-t-(--card-radius) *:[img:last-child]:rounded-b-(--card-radius)',
  variants: {
    background: {
      card: 'bg-card text-card-foreground',
      background: 'bg-background text-foreground',
      'background-soft': 'bg-background/50 text-foreground',
      primary: 'bg-primary text-primary-foreground',
      secondary: 'bg-secondary text-secondary-foreground',
    },
  },
  defaultVariants: { background: 'card' },
})

type CardProps = React.ComponentProps<'div'> &
  VariantProps<typeof cardVariants> & {
    size?: 'md' | 'sm' | 'xs'
  }

function Card({ className, size = 'md', background, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cardVariants({ background, className })}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        'group/card-header @container/card-header grid auto-rows-min items-start gap-1.5 rounded-t-(--card-radius) px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)',
        className,
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn('text-base font-medium', className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-content"
      className={cn('px-(--card-spacing)', className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        'flex items-center rounded-b-(--card-radius) px-(--card-spacing) [.border-t]:pt-(--card-spacing)',
        className,
      )}
      {...props}
    />
  )
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent }
