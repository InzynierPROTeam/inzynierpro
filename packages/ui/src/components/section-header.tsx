import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'
import { cn, tv, type VariantProps } from 'tailwind-variants'

const sectionHeaderVariants = tv({
  base: 'group/section-header flex w-full flex-wrap items-start justify-between',
  variants: {
    size: {
      sm: 'gap-2',
      md: 'gap-3',
      lg: 'gap-3.5',
    },
  },
  defaultVariants: { size: 'md' },
})

type SectionHeaderProps = useRender.ComponentProps<'header'> &
  VariantProps<typeof sectionHeaderVariants>

function SectionHeader({ className, size = 'md', render, ...props }: SectionHeaderProps) {
  return useRender({
    defaultTagName: 'header',
    props: mergeProps<'header'>({ className: sectionHeaderVariants({ size, className }) }, props),
    render,
    state: { slot: 'section-header', size },
  })
}

function SectionHeaderContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="section-header-content"
      className={cn(
        'flex min-w-0 flex-1 flex-col gap-0.5 group-data-[size=lg]/section-header:gap-1 group-data-[size=sm]/section-header:gap-0',
        className,
      )}
      {...props}
    />
  )
}

type SectionHeaderTitleProps = useRender.ComponentProps<'h2'>

function SectionHeaderTitle({ className, render, ...props }: SectionHeaderTitleProps) {
  return useRender({
    defaultTagName: 'h2',
    props: mergeProps<'h2'>(
      {
        className: cn(
          'text-lg leading-snug font-semibold text-balance group-data-[size=lg]/section-header:text-xl group-data-[size=sm]/section-header:text-base',
          className,
        ),
      },
      props,
    ),
    render,
    state: { slot: 'section-header-title' },
  })
}

function SectionHeaderDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="section-header-description"
      className={cn(
        'text-muted-foreground text-base leading-relaxed text-pretty group-data-[size=lg]/section-header:text-lg group-data-[size=sm]/section-header:text-sm',
        className,
      )}
      {...props}
    />
  )
}

function SectionHeaderActions({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="section-header-actions"
      className={cn('flex max-w-full shrink-0 flex-wrap items-center gap-2', className)}
      {...props}
    />
  )
}

export {
  SectionHeader,
  SectionHeaderContent,
  SectionHeaderTitle,
  SectionHeaderDescription,
  SectionHeaderActions,
  sectionHeaderVariants,
}
