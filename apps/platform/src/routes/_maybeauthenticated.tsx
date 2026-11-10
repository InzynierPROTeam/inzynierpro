import { Unauthenticated } from '@inzpro/api-contracts/middleware/authentication/errors'
import { currentSessionQueryOptions } from '@inzpro/queries/modules/identity'
import { createFileRoute } from '@tanstack/react-router'
import { Effect, Option, Schema } from 'effect'
import { apiHttpClient } from '~platform/lib/api-client'

export const Route = createFileRoute('/_maybeauthenticated')({
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

    return { user: Option.getOrUndefined(Option.map(session, value => value.user)) }
  },
})
