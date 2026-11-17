import { QualificationKindId } from '@inzpro/domain/modules/qualification-paths/qualification-kind'
import type { SpecializationId } from '@inzpro/domain/modules/qualification-paths/specialization'
import { qualificationScopesQueryOptions } from '@inzpro/queries/modules/qualification-paths/queries'
import { useQueryClient } from '@tanstack/react-query'
import { Effect, Option, Schema } from 'effect'
import { useEffect } from 'react'
import { apiHttpClient } from '~platform/lib/api-client'

import { onboardingOptionsLimit } from '../config'

type PrefetchScopesProps = { specializationId: SpecializationId; value: string }

export const PrefetchScopes: React.FC<PrefetchScopesProps> = ({ specializationId, value }) => {
  const queryClient = useQueryClient()
  useEffect(() => {
    const selected = Schema.decodeOption(QualificationKindId)(value)

    if (Option.isSome(selected)) {
      void Effect.runPromise(
        Effect.tryPromise(() =>
          queryClient.query(
            qualificationScopesQueryOptions(apiHttpClient, {
              query: {
                specializationId,
                qualificationKindId: selected.value,
                limit: onboardingOptionsLimit,
              },
            }),
          ),
        ).pipe(Effect.ignore),
      )
    }
  }, [queryClient, specializationId, value])

  return null
}
