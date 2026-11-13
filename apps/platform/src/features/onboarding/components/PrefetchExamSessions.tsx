import type { SpecializationId } from '@inzpro/domain/modules/qualification-paths/specialization'
import { examSessionsQueryOptions } from '@inzpro/queries/modules/exam-calendar'
import { useQueryClient } from '@tanstack/react-query'
import { Effect } from 'effect'
import { useEffect } from 'react'
import { apiHttpClient } from '~platform/lib/api-client'

import { onboardingSessionsLimit } from '../config'

type PrefetchExamSessionsProps = { specializationId: SpecializationId }

export const PrefetchExamSessions: React.FC<PrefetchExamSessionsProps> = ({ specializationId }) => {
  const queryClient = useQueryClient()
  useEffect(() => {
    void Effect.runPromise(
      Effect.tryPromise(() =>
        queryClient.query(
          examSessionsQueryOptions(apiHttpClient, {
            query: { specializationId, limit: onboardingSessionsLimit },
          }),
        ),
      ).pipe(Effect.ignore),
    )
  }, [queryClient, specializationId])

  return null
}
