import { Unauthenticated } from '@inzpro/api-contracts/middleware/authentication/errors'
import { currentSessionQueryOptions } from '@inzpro/queries/modules/identity'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { Effect, Option, Schema } from 'effect'
import { AppLayout } from '~platform/layout/app/AppLayout'
import { apiHttpClient } from '~platform/lib/api-client'

export const Route = createFileRoute('/(app)/_authenticated')({
  beforeLoad: async ({ location, context: { queryClient } }) => {
    // Only a refused session signs out; network and server failures reach the error boundary.
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
      // Data cached for a previous account must not outlive its session.
      queryClient.clear()

      throw redirect({ to: '/login', search: { redirect: location.href }, replace: true })
    }

    return { user: session.value.user }
  },
  component: AppLayout,
})
