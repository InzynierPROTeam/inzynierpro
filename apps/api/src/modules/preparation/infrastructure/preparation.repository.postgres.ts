import { Data, DateTime, Effect, Layer, Option } from 'effect'
import { SqlClient } from 'effect/sql'
import { PreparationWriteError } from '~api/modules/preparation/application/errors.js'
import { PreparationRepository } from '~api/modules/preparation/application/preparation.repository.js'

// Keep the operation's generic error separate from SQL failures without changing rollback behavior.
class PreparationTransactionFailure<E> extends Data.TaggedError('PreparationTransactionFailure')<{
  readonly error: E
}> {}

export const PreparationRepositoryLive = Layer.effect(
  PreparationRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    return PreparationRepository.of({
      transaction: Effect.fn('PreparationRepository.transaction')(function* (operation) {
        return yield* sql
          .withTransaction(
            operation.pipe(Effect.mapError(error => new PreparationTransactionFailure({ error }))),
          )
          .pipe(
            Effect.catchTags({
              SqlError: cause => Effect.fail(new PreparationWriteError({ cause })),
              PreparationTransactionFailure: failure => Effect.fail(failure.error),
            }),
          )
      }),
      lockUser: Effect.fn('PreparationRepository.lockUser')(function* (userId) {
        return yield* sql`SELECT id FROM users WHERE id=${userId} LIMIT 1 FOR UPDATE`.pipe(
          Effect.asVoid,
          Effect.catchTags({
            SqlError: cause => Effect.fail(new PreparationWriteError({ cause })),
          }),
        )
      }),
      insert: Effect.fn('PreparationRepository.insert')(function* (userId, pathId, scope) {
        return yield* sql`INSERT INTO user_qualification_paths (user_id,qualification_path_id,access_scope) VALUES (${userId},${pathId},${scope})`.pipe(
          Effect.asVoid,
          Effect.catchTags({
            SqlError: cause => Effect.fail(new PreparationWriteError({ cause })),
          }),
        )
      }),
      appendGoal: Effect.fn('PreparationRepository.appendGoal')(
        function* (userId, pathId, version, sessionId, scope, oralDate) {
          const oralExamDate = Option.match(oralDate, {
            onNone: () => null,
            onSome: DateTime.formatIso,
          })

          return yield* sql`INSERT INTO user_exam_goals (user_id,qualification_path_id,version,exam_session_id,access_scope,oral_exam_date) VALUES (${userId},${pathId},${version},${sessionId},${scope},${oralExamDate})`.pipe(
            Effect.asVoid,
            Effect.catchTags({
              SqlError: cause => Effect.fail(new PreparationWriteError({ cause })),
            }),
          )
        },
      ),
      archive: Effect.fn('PreparationRepository.archive')(
        function* (userId, pathId) {
          yield* sql`UPDATE user_qualification_paths SET archived_at=coalesce(archived_at,now()) WHERE user_id=${userId} AND qualification_path_id=${pathId}`
        },
        Effect.catchTags({
          SqlError: cause => Effect.fail(new PreparationWriteError({ cause })),
        }),
      ),
      restore: Effect.fn('PreparationRepository.restore')(function* (userId, pathId) {
        return yield* sql`UPDATE user_qualification_paths SET archived_at=NULL WHERE user_id=${userId} AND qualification_path_id=${pathId}`.pipe(
          Effect.asVoid,
          Effect.catchTags({
            SqlError: cause => Effect.fail(new PreparationWriteError({ cause })),
          }),
        )
      }),
      extend: Effect.fn('PreparationRepository.extend')(function* (userId, pathId) {
        return yield* sql`UPDATE user_qualification_paths SET access_scope='both' WHERE user_id=${userId} AND qualification_path_id=${pathId}`.pipe(
          Effect.asVoid,
          Effect.catchTags({
            SqlError: cause => Effect.fail(new PreparationWriteError({ cause })),
          }),
        )
      }),
    })
  }),
)
