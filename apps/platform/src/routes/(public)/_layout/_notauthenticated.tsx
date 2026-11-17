import { Unauthenticated } from '@inzpro/api-contracts/middleware/authentication/errors'
import { currentSessionQueryOptions } from '@inzpro/queries/modules/identity/queries'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { Effect, Schema, Option } from 'effect'
import { apiHttpClient } from '~platform/lib/api-client'

export const Route = createFileRoute('/(public)/_layout/_notauthenticated')({
  beforeLoad: async ({ context: { queryClient } }) => {
    const session = await Effect.runPromise(
      Effect.tryPromise(() => queryClient.query(currentSessionQueryOptions(apiHttpClient))).pipe(
        Effect.asSome,
        Effect.catchIf(
          error => Schema.is(Unauthenticated)(error.cause),
          () => Effect.succeedNone,
        ),
      ),
    )

    if (Option.isSome(session)) {
      throw redirect({
        replace: true,
        to: '/start',
      })
    }

    return {
      session: session.valueOrUndefined,
    }
  },
})
