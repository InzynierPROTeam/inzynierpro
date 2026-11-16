import type { Percent } from '@inzpro/domain/common/percent'
import type React from 'react'
import { cx } from 'tailwind-variants'

import { useEntered } from '../hooks/useEntered'
import { Odometer } from './Odometer'

type SessionResultRingProps = {
  total: number
  answered: number
  correct: number
  percent: Percent
}

export const SessionResultRing: React.FC<SessionResultRingProps> = ({
  total,
  answered,
  correct,
  percent,
}) => {
  const entered = useEntered()

  return (
    <div
      role="img"
      aria-label={`Wynik ${percent}%: ${correct} poprawnych z ${total} pytań, odpowiedziano na ${answered}`}
      className="relative grid size-48 place-items-center self-center"
    >
      <svg
        viewBox="0 0 120 120"
        className="absolute inset-0 -rotate-90"
        aria-hidden
      >
        <RingArc
          className="stroke-muted-foreground/15"
          share={1}
          entered
        />
        <RingArc
          className="stroke-primary"
          share={total > 0 ? answered / total : 0}
          entered={entered}
        />
        <RingArc
          className="stroke-success delay-150"
          share={total > 0 ? correct / total : 0}
          entered={entered}
        />
      </svg>
      <div
        className="flex flex-col items-center"
        aria-hidden
      >
        <span className="flex items-baseline text-4xl font-bold">
          <Odometer
            value={percent}
            entered={entered}
          />
          <span className="text-2xl">%</span>
        </span>
        <span className="text-muted-foreground text-sm">poprawnych</span>
      </div>
    </div>
  )
}

type RingArcProps = { className: string; share: number; entered: boolean }

const RingArc: React.FC<RingArcProps> = ({ className, share, entered }) => (
  <circle
    cx="60"
    cy="60"
    r="52"
    fill="none"
    strokeWidth="12"
    pathLength={100}
    strokeDasharray="100 100"
    strokeDashoffset={entered ? 100 - share * 100 : 100}
    className={cx(
      'ease-out-strong transition-[stroke-dashoffset] duration-700 motion-reduce:transition-none',
      className,
    )}
  />
)
