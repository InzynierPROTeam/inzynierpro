import { Radio as RadioPrimitive } from '@base-ui/react/radio'
import { cn, tv, type VariantProps } from 'tailwind-variants'

import { Skeleton } from './skeleton.js'

// The indicator hides in narrow containers, so place options inside an `@container` (the radio group).
const answerOptionVariants = tv({
  base: 'group/answer-option bg-card text-card-foreground focus-visible:ring-ring flex w-full items-center gap-4 rounded-xl border-2 p-4 pr-6 text-left text-sm leading-relaxed transition-all outline-none focus-visible:ring-2 data-disabled:cursor-not-allowed',
  variants: {
    tone: {
      neutral:
        'data-checked:border-primary/30 data-checked:bg-primary/10 not-data-disabled:cursor-pointer not-data-checked:not-data-disabled:hover:border-primary/15 not-data-checked:not-data-disabled:hover:bg-primary/5',
      correct: 'border-success/30 bg-success/5',
      incorrect: 'border-destructive/30 bg-destructive/5',
    },
  },
  defaultVariants: { tone: 'neutral' },
})

const answerOptionIndicatorStyles = cn(
  'bg-muted flex size-8 shrink-0 items-center justify-center rounded-full font-medium transition-colors @max-md:hidden [&_svg]:size-4',
  'group-[[data-tone=neutral][data-checked]]/answer-option:bg-primary group-[[data-tone=neutral][data-checked]]/answer-option:text-primary-foreground',
  'group-data-[tone=correct]/answer-option:bg-success group-data-[tone=correct]/answer-option:text-success-foreground',
  'group-data-[tone=incorrect]/answer-option:bg-destructive group-data-[tone=incorrect]/answer-option:text-destructive-foreground',
)

type AnswerOptionVariants = VariantProps<typeof answerOptionVariants>

type AnswerOptionTone = NonNullable<AnswerOptionVariants['tone']>

type AnswerOptionProps = Omit<RadioPrimitive.Root.Props, 'className'> &
  AnswerOptionVariants & { className?: string }

function AnswerOption({ className, tone = 'neutral', ...props }: AnswerOptionProps) {
  return (
    <RadioPrimitive.Root
      data-slot="answer-option"
      data-tone={tone}
      className={answerOptionVariants({ tone, className })}
      {...props}
    />
  )
}

function AnswerOptionIndicator({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="answer-option-indicator"
      className={cn(answerOptionIndicatorStyles, className)}
      {...props}
    />
  )
}

function AnswerOptionText({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="answer-option-text"
      className={cn('flex-1', className)}
      {...props}
    />
  )
}

type AnswerOptionSkeletonProps = React.ComponentProps<'div'> & {
  textClassName?: string
}

function AnswerOptionSkeleton({ className, textClassName, ...props }: AnswerOptionSkeletonProps) {
  return (
    <div
      data-slot="answer-option-skeleton"
      className={answerOptionVariants({ className })}
      {...props}
    >
      <Skeleton className={cn(answerOptionIndicatorStyles, 'rounded-full')} />
      <Skeleton className={cn('my-1 h-3.5 w-full rounded-sm', textClassName)} />
    </div>
  )
}

export {
  AnswerOption,
  AnswerOptionIndicator,
  AnswerOptionText,
  AnswerOptionSkeleton,
  answerOptionVariants,
  type AnswerOptionTone,
}
