import { formatDuration, getRemainingDuration, getUtcIsoDateTimeAfter } from '@inzpro/utils/date'
import { Duration } from 'effect'
import type React from 'react'
import { useEffect, useEffectEvent, useState } from 'react'

const wholeSeconds = (duration: Duration.Duration) =>
  Duration.seconds(Math.ceil(Duration.toSeconds(duration)))

type CountdownProps = {
  remaining: Duration.Duration
  onFinish: () => void
}

export const Countdown: React.FC<CountdownProps> = ({ remaining, onFinish }) => (
  <CountdownTimer
    key={Duration.toMillis(remaining)}
    remaining={remaining}
    onFinish={onFinish}
  />
)

const CountdownTimer: React.FC<CountdownProps> = ({ remaining, onFinish }) => {
  const [endsAt] = useState(() => getUtcIsoDateTimeAfter(remaining))
  const [left, setLeft] = useState(() => wholeSeconds(remaining))
  const finish = useEffectEvent(onFinish)

  useEffect(() => {
    if (Duration.isZero(getRemainingDuration(endsAt))) {
      finish()

      return
    }

    const interval = setInterval(
      () => {
        const current = getRemainingDuration(endsAt)

        setLeft(wholeSeconds(current))

        if (Duration.isZero(current)) {
          clearInterval(interval)
          finish()
        }
      },
      Duration.toMillis(Duration.seconds(1)),
    )

    return () => clearInterval(interval)
  }, [endsAt])

  return formatDuration(left)
}
