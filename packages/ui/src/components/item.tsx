import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import { cn, tv, type VariantProps } from 'tailwind-variants'

import { Separator } from './separator.js'

function ItemGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      role="list"
      data-slot="item-group"
      className={cn(
        'group/item-group flex w-full flex-col gap-4 has-[>[data-slot=item][data-size=lg]]:gap-4.5 has-[>[data-slot=item][data-size=sm]]:gap-3 has-[>[data-slot=item][data-size=xl]]:gap-5 has-[>[data-slot=item][data-size=xs]]:gap-2.5',
        className,
      )}
      {...props}
    />
  )
}

function ItemSeparator({ className, ...props }: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="item-separator"
      orientation="horizontal"
      className={cn('my-2', className)}
      {...props}
    />
  )
}

const itemVariants = tv({
  base: 'group/item flex w-full flex-wrap items-center rounded-2xl border text-sm transition-colors duration-100 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
  variants: {
    variant: {
      transparent: 'border-transparent',
      outline: 'border-border',
      muted: 'border-transparent bg-muted',
      'muted-soft': 'border-transparent bg-muted/50',
      background: 'border-transparent bg-background',
      'background-soft': 'border-transparent bg-background/50',
    },
    size: {
      xl: 'gap-5 px-5 py-4.5',
      lg: 'gap-4 px-4.5 py-4',
      md: 'gap-3.5 px-4 py-3.5',
      sm: 'gap-3.5 px-3.5 py-3',
      xs: 'gap-2.5 px-3 py-2.5 in-data-[slot=dropdown-menu-content]:p-0',
    },
  },
  defaultVariants: { variant: 'transparent', size: 'md' },
})

type ItemProps = useRender.ComponentProps<'div'> & VariantProps<typeof itemVariants>

function Item({ className, variant = 'transparent', size = 'md', render, ...props }: ItemProps) {
  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(
      {
        className: cn(itemVariants({ variant, size, className })),
      },
      props,
    ),
    render,
    state: {
      slot: 'item',
      variant,
      size,
    },
  })
}

function ItemMedia({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="item-media"
      className={cn('flex shrink-0 items-center justify-center', className)}
      {...props}
    />
  )
}

function ItemContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="item-content"
      className={cn(
        'flex min-w-0 flex-1 flex-col gap-2 group-data-[size=lg]/item:gap-3 group-data-[size=xl]/item:gap-4 group-data-[size=xs]/item:gap-1.5 [&+[data-slot=item-content]]:flex-none',
        className,
      )}
      {...props}
    />
  )
}

function ItemTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="item-title"
      className={cn(
        'line-clamp-1 flex w-fit items-center gap-2 text-sm leading-snug font-medium underline-offset-4 group-data-[size=lg]/item:text-base group-data-[size=xl]/item:text-lg',
        className,
      )}
      {...props}
    />
  )
}

function ItemDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="item-description"
      className={cn(
        'text-muted-foreground line-clamp-2 text-start text-sm font-normal group-data-[size=xl]/item:text-base [&>a]:underline [&>a]:underline-offset-4',
        className,
      )}
      {...props}
    />
  )
}

function ItemActions({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="item-actions"
      className={cn('flex shrink-0 items-center gap-2', className)}
      {...props}
    />
  )
}

function ItemHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="item-header"
      className={cn('flex basis-full items-center justify-between gap-2', className)}
      {...props}
    />
  )
}

function ItemFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="item-footer"
      className={cn('flex basis-full items-center justify-between gap-2', className)}
      {...props}
    />
  )
}

export {
  Item,
  ItemMedia,
  ItemContent,
  ItemActions,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
  ItemDescription,
  ItemHeader,
  ItemFooter,
}
