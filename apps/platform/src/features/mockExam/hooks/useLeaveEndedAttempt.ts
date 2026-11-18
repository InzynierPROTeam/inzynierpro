import type { MockExamAttempt } from '@inzpro/api-contracts/modules/mock-exams/responses'
import { mockExamKeys } from '@inzpro/queries/modules/mock-exams/keys'
import { streakKeys } from '@inzpro/queries/modules/streak/keys'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useEffectEvent } from 'react'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'

export const useLeaveEndedAttempt = (attempt: MockExamAttempt) => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const client = useQueryClient()
  const navigate = useNavigate()

  const leaveAttempt = useEffectEvent(async () => {
    await Promise.all([
      client.invalidateQueries({
        queryKey: mockExamKeys.path(user.id, selectedPath.id),
        refetchType: 'none',
      }),
      client.invalidateQueries({
        queryKey: mockExamKeys.review(user.id, selectedPath.id, attempt.id),
        refetchType: 'none',
      }),
      client.invalidateQueries({ queryKey: streakKeys.account(user.id) }),
    ])

    if (attempt.status === 'abandoned') {
      await navigate({ to: '/egzamin-probny', replace: true })

      return
    }

    await navigate({
      to: '/egzamin-probny/podejscie/$attemptId/podsumowanie',
      params: { attemptId: attempt.id },
      replace: true,
    })
  })

  useEffect(() => {
    if (attempt.status === 'finished' || attempt.status === 'abandoned') {
      void leaveAttempt()
    }
  }, [attempt.status])
}
