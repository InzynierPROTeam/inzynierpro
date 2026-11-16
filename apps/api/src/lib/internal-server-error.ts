import { InternalServerError } from '@inzpro/api-contracts/utils/api-error'
import { Effect } from 'effect'

export const logAndFailInternalServerError =
  (message: string) =>
  (error: { readonly _tag: string }): Effect.Effect<never, InternalServerError> =>
    Effect.logError(message, error).pipe(
      Effect.annotateLogs('error.type', error._tag),
      Effect.andThen(Effect.annotateCurrentSpan('error.type', error._tag)),
      Effect.andThen(
        Effect.fail(new InternalServerError({ type: 'internal_server_error', message })),
      ),
    )
