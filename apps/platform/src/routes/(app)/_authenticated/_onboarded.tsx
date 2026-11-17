import { Unauthenticated } from '@inzpro/api-contracts/middleware/authentication/errors'
import { PageLimit } from '@inzpro/domain/common/pagination'
import { maxUserQualificationPaths } from '@inzpro/domain/modules/preparation/config'
import { pathsQueryOptions } from '@inzpro/queries/modules/preparation/queries'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { Effect, Option, Schema } from 'effect'
import { selectedPathStore } from '~platform/features/examPaths/utils'
import { apiHttpClient } from '~platform/lib/api-client'

export const Route = createFileRoute('/(app)/_authenticated/_onboarded')({
  beforeLoad: async ({ context: { queryClient, session }, location }) => {
    const result = await Effect.runPromise(
      Effect.tryPromise(() =>
        queryClient.query(
          pathsQueryOptions(apiHttpClient, session.user.id, {
            query: { limit: PageLimit.make(maxUserQualificationPaths) },
          }),
        ),
      ).pipe(
        Effect.asSome,
        Effect.catchIf(
          error => Schema.is(Unauthenticated)(error.cause),
          () => Effect.succeedNone,
        ),
      ),
    )

    if (Option.isNone(result)) {
      queryClient.clear()
      throw redirect({ to: '/logowanie', search: { redirect: location.href }, replace: true })
    }

    const selectedPath = selectedPathStore.synchronize(session.user.id, result.value.data)

    if (selectedPath === undefined) {
      throw redirect({ to: '/pierwsze-kroki', replace: true })
    }

    return { selectedPath }
  },
})
