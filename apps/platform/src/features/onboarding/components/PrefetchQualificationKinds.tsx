import { SpecializationId } from '@inzpro/domain/modules/qualification-paths/specialization'
import { qualificationKindsQueryOptions } from '@inzpro/queries/modules/qualification-paths'
import { useQueryClient } from '@tanstack/react-query'
import { Effect, Option, Schema } from 'effect'
import { useEffect } from 'react'
import { apiHttpClient } from '~platform/lib/api-client'

import { onboardingOptionsLimit } from '../config'

type PrefetchQualificationKindsProps = { value: string }

export const PrefetchQualificationKinds: React.FC<PrefetchQualificationKindsProps> = ({
  value,
}) => {
  const queryClient = useQueryClient()
  useEffect(() => {
    const selected = Schema.decodeOption(SpecializationId)(value)

    if (Option.isSome(selected)) {
      void Effect.runPromise(
        Effect.tryPromise(() =>
          queryClient.query(
            qualificationKindsQueryOptions(apiHttpClient, {
              query: { specializationId: selected.value, limit: onboardingOptionsLimit },
            }),
          ),
        ).pipe(Effect.ignore),
      )
    }
  }, [queryClient, value])

  return null
}
