import type { MockExamAttempt } from '@inzpro/api-contracts/modules/mock-exams/responses'
import { mockExamAttemptQueryOptions } from '@inzpro/queries/modules/mock-exams/queries'
import { formatDuration, getRemainingDuration } from '@inzpro/utils/date'
import { useQueryClient } from '@tanstack/react-query'
import { Duration } from 'effect'
import { Pause, Timer } from 'lucide-react'
import type React from 'react'
import { Countdown } from '~platform/components/Countdown'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

type AttemptTimerProps = { attempt: MockExamAttempt }

export const AttemptTimer: React.FC<AttemptTimerProps> = ({ attempt }) => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const client = useQueryClient()

  const refreshAttempt = () =>
    void client.invalidateQueries(
      mockExamAttemptQueryOptions(apiHttpClient, user.id, {
        params: { qualificationPathId: selectedPath.id, attemptId: attempt.id },
      }),
    )

  return (
    <p
      role="timer"
      aria-label="Pozostały czas"
      className="flex items-center justify-center gap-1.5 font-medium tabular-nums"
    >
      <Timer
        aria-hidden
        className="size-4"
      />
      <Countdown
        remaining={getRemainingDuration(attempt.deadline, attempt.serverTime)}
        onFinish={refreshAttempt}
      />
    </p>
  )
}

export const PausedAttemptTimer: React.FC<AttemptTimerProps> = ({ attempt }) => (
  <p
    role="timer"
    aria-label="Pozostały czas, wstrzymany"
    className="text-muted-foreground flex items-center justify-center gap-1.5 font-medium tabular-nums"
  >
    <Pause
      aria-hidden
      className="size-4"
    />
    {formatDuration(
      Duration.seconds(
        Math.ceil(Duration.toSeconds(getRemainingDuration(attempt.deadline, attempt.serverTime))),
      ),
    )}
  </p>
)
