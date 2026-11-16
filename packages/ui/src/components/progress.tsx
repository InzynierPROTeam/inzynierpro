import { Progress as ProgressPrimitive } from '@base-ui/react/progress'
import { cn, tv, type VariantProps } from 'tailwind-variants'

import { Skeleton } from './skeleton.js'

const progressVariants = tv({
  slots: {
    root: 'group/progress flex flex-wrap',
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
      xs: { root: 'gap-1.5', track: 'h-1' },
      sm: { root: 'gap-2', track: 'h-2' },
      md: { root: 'gap-2.5', track: 'h-3' },
      lg: { root: 'gap-3', track: 'h-4' },
    },
  },
  defaultVariants: { variant: 'muted', size: 'md' },
})

type ProgressVariants = VariantProps<typeof progressVariants>

type ProgressProps = Omit<ProgressPrimitive.Root.Props, 'className'> &
  ProgressVariants & { className?: string }

function Progress({ className, children, variant, size = 'md', ...props }: ProgressProps) {
  const styles = progressVariants({ variant, size })

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      data-size={size}
      className={styles.root({ className })}
      {...props}
    >
      {children}
      <ProgressPrimitive.Track
        data-slot="progress-track"
        className={styles.track()}
      >
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          className={styles.indicator()}
        />
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  )
}

const progressTextSizes =
  'text-sm group-data-[size=lg]/progress:text-base group-data-[size=xs]/progress:text-xs'

function ProgressLabel({ className, ...props }: ProgressPrimitive.Label.Props) {
  return (
    <ProgressPrimitive.Label
      className={cn('font-medium', progressTextSizes, className)}
      data-slot="progress-label"
      {...props}
    />
  )
}

function ProgressValue({ className, ...props }: ProgressPrimitive.Value.Props) {
  return (
    <ProgressPrimitive.Value
      className={cn('text-muted-foreground ms-auto tabular-nums', progressTextSizes, className)}
      data-slot="progress-value"
      {...props}
    />
  )
}

type ProgressSkeletonProps = React.ComponentProps<'div'> & Pick<ProgressVariants, 'size'>

function ProgressSkeleton({ className, size, ...props }: ProgressSkeletonProps) {
  return (
    <Skeleton
      data-slot="progress-skeleton"
      className={progressVariants({ size }).track({ className })}
      {...props}
    />
  )
}

export { Progress, ProgressLabel, ProgressValue, ProgressSkeleton, progressVariants }
