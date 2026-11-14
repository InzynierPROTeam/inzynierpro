import { ProgressSkeleton } from '@inzpro/ui/components/progress'
import { TextSkeleton } from '@inzpro/ui/components/text-skeleton'
import { createLink } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type React from 'react'
import { cn } from 'tailwind-variants'

// Session-agnostic: written, oral and review sessions compose it with their own links and progress.

export const SessionHeader: React.FC<React.ComponentProps<'header'>> = ({
  className,
  ...props
}) => (
  <header
    className={cn('flex flex-col gap-4 max-sm:gap-2', className)}
    {...props}
  />
)

export const SessionHeaderNav: React.FC<React.ComponentProps<'nav'>> = ({
  className,
  ...props
}) => (
  <nav
    className={cn(
      'grid grid-cols-[100px_1fr_100px] items-center gap-4 max-md:grid-cols-[20px_1fr_20px]',
      className,
    )}
    {...props}
  />
)

export const SessionHeaderTitle: React.FC<React.ComponentProps<'h1'>> = ({
  className,
  ...props
}) => (
  <h1
    className={cn(
      'col-start-2 place-self-center text-center text-2xl font-bold max-md:text-xl max-sm:text-lg',
      className,
    )}
    {...props}
  />
)

// The slots keep their grid columns when there is no previous or next question.

export const SessionHeaderPrevious: React.FC<React.ComponentProps<'div'>> = ({
  className,
  ...props
}) => (
  <div
    className={cn('col-start-1 row-start-1 justify-self-start', className)}
    {...props}
  />
)

export const SessionHeaderNext: React.FC<React.ComponentProps<'div'>> = ({
  className,
  ...props
}) => (
  <div
    className={cn('col-start-3 row-start-1 justify-self-end', className)}
    {...props}
  />
)

type SessionTraverseAnchorProps = React.ComponentProps<'a'> & {
  direction: 'previous' | 'next'
}

const SessionTraverseAnchor: React.FC<SessionTraverseAnchorProps> = ({
  direction,
  className,
  ...props
}) => (
  <a
    className={cn(
      'text-foreground/50 hover:text-foreground/70 flex items-center gap-1 text-sm transition-colors',
      className,
    )}
    {...props}
  >
    {direction === 'previous' ? (
      <>
        <ChevronLeft className="size-5 shrink-0" />
        <span className="max-md:sr-only">Poprzednie</span>
      </>
    ) : (
      <>
        <span className="max-md:sr-only">Następne</span>
        <ChevronRight className="size-5 shrink-0" />
      </>
    )}
  </a>
)

/** A typed router link to the previous or next question of any session route. */
export const SessionTraverseLink = createLink(SessionTraverseAnchor)

export const SessionHeaderSkeleton: React.FC = () => (
  <div className="flex flex-col gap-4 max-sm:gap-2">
    <TextSkeleton
      size="2xl"
      className="w-40 self-center"
    />
    <div className="flex flex-col gap-3">
      <div className="flex justify-between">
        <TextSkeleton
          size="sm"
          className="w-36"
        />
        <TextSkeleton
          size="sm"
          className="w-10"
        />
      </div>
      <ProgressSkeleton size="sm" />
    </div>
  </div>
)
