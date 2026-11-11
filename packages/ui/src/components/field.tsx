import * as React from 'react'
import { cn } from 'tailwind-variants'
import { Label } from '~ui/components/label.js'

export function FieldGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="field-group"
      className={cn('flex w-full flex-col gap-5', className)}
      {...props}
    />
  )
}

export function Field({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      role="group"
      data-slot="field"
      className={cn(
        'group/field data-[invalid=true]:text-destructive flex w-full flex-col gap-2',
        className,
      )}
      {...props}
    />
  )
}

export function FieldLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="field-label"
      className={cn('group-data-[invalid=true]/field:text-destructive', className)}
      {...props}
    />
  )
}

export function FieldDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="field-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

export function FieldError({ className, children, ...props }: React.ComponentProps<'div'>) {
  if (children === undefined || children === null || children === '') {
    return null
  }

  return (
    <div
      role="alert"
      data-slot="field-error"
      className={cn('text-destructive text-sm font-normal', className)}
      {...props}
    >
      {children}
    </div>
  )
}
