import { Context, Data, Effect, Layer } from 'effect'
import { SqlClient, type SqlError } from 'effect/sql'
import { logAndFailInternalServerError } from '~api/lib/internal-server-error.js'

export class TransactionError extends Data.TaggedError('TransactionError')<{
  readonly cause: SqlError.SqlError
}> {}

export class Transaction extends Context.Service<
  Transaction,
  {
    readonly run: <A, E, R>(
      operation: Effect.Effect<A, E, R>,
    ) => Effect.Effect<A, E | TransactionError, R>
  }
>()('api/lib/Transaction') {}

class TransactionFailure<E> extends Data.TaggedError('TransactionFailure')<{
  readonly error: E
}> {}

export const TransactionLive = Layer.effect(
  Transaction,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    return Transaction.of({
      run: Effect.fn('Transaction.run')(function* (operation) {
        return yield* sql
          .withTransaction(
            operation.pipe(Effect.mapError(error => new TransactionFailure({ error }))),
          )
          .pipe(
            Effect.catchTags({
              SqlError: cause => Effect.fail(new TransactionError({ cause })),
              TransactionFailure: failure => Effect.fail(failure.error),
            }),
          )
      }),
    })
  }),
)

export const failTransaction = logAndFailInternalServerError('Could not complete the change.')
