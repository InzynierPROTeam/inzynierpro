import { InternalServerError } from '@inzpro/api-contracts/utils/api-error'
import { Effect } from 'effect'

/**
 * Maps an unexpected infrastructure failure to HTTP 500 (ADR-0022). The original error is logged
 * once with its cause and tagged on the current span as `error.type`; the client sees only the
 * message. Business errors such as access denial are mapped to their own responses instead.
 */
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
