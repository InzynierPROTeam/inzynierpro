import { Unauthenticated } from '@inzpro/api-contracts/middleware/authentication/errors'
import { currentSessionQueryOptions } from '@inzpro/queries/modules/identity/queries'
import { canSsrWithCookies } from '@inzpro/react-utils/tanstack-start/cookies'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { Effect, Option, Schema } from 'effect'
import { selectedPathStore } from '~platform/features/examPaths/utils'
import { AppLayout } from '~platform/layout/app/AppLayout'
import { apiHttpClient } from '~platform/lib/api-client'

export const Route = createFileRoute('/(app)/_authenticated')({
  ssr: canSsrWithCookies,
  beforeLoad: async ({ location, context: { queryClient } }) => {
    const session = await Effect.runPromise(
      Effect.tryPromise(() => queryClient.query(currentSessionQueryOptions(apiHttpClient))).pipe(
        Effect.asSome,
        Effect.catchIf(
          error => Schema.is(Unauthenticated)(error.cause),
          () => Effect.succeedNone,
        ),
      ),
    )

    if (Option.isNone(session)) {
      queryClient.clear()
      throw redirect({ to: '/logowanie', search: { redirect: location.href }, replace: true })
    }

    return {
      session: session.value,
      selectedPathId: selectedPathStore.get(session.value.user.id),
    }
  },
  component: AppLayout,
})
