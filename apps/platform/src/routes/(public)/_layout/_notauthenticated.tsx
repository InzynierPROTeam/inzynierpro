import { currentSessionQueryOptions } from '@inzpro/queries/modules/identity'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { Effect, Option } from 'effect'
import { apiHttpClient } from '~platform/lib/api-client'

export const Route = createFileRoute('/(public)/_layout/_notauthenticated')({
  beforeLoad: async ({ context: { queryClient } }) => {
    // Any failure counts as signed out, so public pages stay available when the API is down.
    const session = await Effect.runPromise(
      Effect.option(
        Effect.tryPromise(() => queryClient.query(currentSessionQueryOptions(apiHttpClient))),
      ),
    )

    if (Option.isSome(session)) {
      throw redirect({ to: '/start', replace: true })
    }
  },
})
