import { Progress as ProgressPrimitive } from '@base-ui/react/progress'
import { createContext, useContext } from 'react'
import { cn, tv, type VariantProps } from 'tailwind-variants'

import { Skeleton } from './skeleton.js'

const progressVariants = tv({
  slots: {
    track: 'relative flex w-full items-center overflow-x-hidden rounded-full',
    indicator: 'h-full transition-all',
  },
  variants: {
    variant: {
      // Muted track: only visible on card or background surfaces.
      muted: { track: 'bg-muted', indicator: 'bg-primary' },
      // Tinted track: visible on muted and translucent surfaces as well.
      primary: { track: 'bg-primary/15', indicator: 'bg-primary' },
      gradient: {
        track: 'bg-primary/15',
        indicator: 'from-primary bg-linear-to-r to-indigo-500',
      },
      success: { track: 'bg-success/15', indicator: 'bg-success' },
      foreground: { track: 'bg-foreground/10', indicator: 'bg-foreground' },
      // For primary-coloured surfaces such as a primary card.
      'primary-foreground': {
        track: 'bg-primary-foreground/25',
        indicator: 'bg-primary-foreground',
      },
    },
    size: {
      xs: { track: 'h-1' },
      sm: { track: 'h-2' },
      md: { track: 'h-3' },
      lg: { track: 'h-4' },
    },
  },
  defaultVariants: { variant: 'muted', size: 'md' },
})

type ProgressVariants = VariantProps<typeof progressVariants>

const ProgressStylesContext = createContext(progressVariants())

type ProgressProps = ProgressPrimitive.Root.Props & ProgressVariants

function Progress({ className, children, value, variant, size, ...props }: ProgressProps) {
  return (
    <ProgressStylesContext value={progressVariants({ variant, size })}>
      <ProgressPrimitive.Root
        value={value}
        data-slot="progress"
        className={cn('flex flex-wrap gap-3', className)}
        {...props}
      >
        {children}
        <ProgressTrack>
          <ProgressIndicator />
        </ProgressTrack>
      </ProgressPrimitive.Root>
    </ProgressStylesContext>
  )
}

function ProgressTrack({ className, ...props }: ProgressPrimitive.Track.Props) {
  const styles = useContext(ProgressStylesContext)

  return (
    <ProgressPrimitive.Track
      className={cn(styles.track(), className)}
      data-slot="progress-track"
      {...props}
    />
  )
}

function ProgressIndicator({ className, ...props }: ProgressPrimitive.Indicator.Props) {
  const styles = useContext(ProgressStylesContext)

  return (
    <ProgressPrimitive.Indicator
      data-slot="progress-indicator"
      className={cn(styles.indicator(), className)}
      {...props}
    />
  )
}

function ProgressLabel({ className, ...props }: ProgressPrimitive.Label.Props) {
  return (
    <ProgressPrimitive.Label
      className={cn('text-sm font-medium', className)}
      data-slot="progress-label"
      {...props}
    />
  )
}

function ProgressValue({ className, ...props }: ProgressPrimitive.Value.Props) {
  return (
    <ProgressPrimitive.Value
      className={cn('text-muted-foreground ms-auto text-sm tabular-nums', className)}
      data-slot="progress-value"
      {...props}
    />
  )
}

type ProgressSkeletonProps = React.ComponentProps<'div'> & Pick<ProgressVariants, 'size'>

// A track-sized placeholder for a Progress without a label.
function ProgressSkeleton({ className, size, ...props }: ProgressSkeletonProps) {
  return (
    <Skeleton
      data-slot="progress-skeleton"
      className={progressVariants({ size }).track({ className })}
      {...props}
    />
  )
}

export {
  Progress,
  ProgressTrack,
  ProgressIndicator,
  ProgressLabel,
  ProgressValue,
  ProgressSkeleton,
  progressVariants,
}
