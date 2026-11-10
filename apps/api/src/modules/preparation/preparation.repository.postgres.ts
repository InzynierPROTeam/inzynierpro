import { Data, DateTime, Effect, Layer, Option } from 'effect'
import { SqlClient } from 'effect/sql'
import { PreparationWriteError } from '~api/modules/preparation/errors.js'
import { PreparationRepository } from '~api/modules/preparation/preparation.repository.js'

// Keep the operation's generic error separate from SQL failures without changing rollback behavior.
class PreparationTransactionFailure<E> extends Data.TaggedError('PreparationTransactionFailure')<{
  readonly error: E
}> {}

export const PreparationRepositoryLive = Layer.effect(
  PreparationRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    return PreparationRepository.of({
      transaction: operation =>
        sql
          .withTransaction(
            operation.pipe(Effect.mapError(error => new PreparationTransactionFailure({ error }))),
          )
          .pipe(
            Effect.catchTags({
              SqlError: cause => Effect.fail(new PreparationWriteError({ cause })),
              PreparationTransactionFailure: failure => Effect.fail(failure.error),
            }),
          ),
      lockUser: userId =>
        sql`SELECT id FROM users WHERE id=${userId} LIMIT 1 FOR UPDATE`.pipe(
          Effect.asVoid,
          Effect.catchTags({
            SqlError: cause => Effect.fail(new PreparationWriteError({ cause })),
          }),
        ),
      insert: (userId, pathId, scope) =>
        sql`INSERT INTO user_qualification_paths (user_id,qualification_path_id,access_scope) VALUES (${userId},${pathId},${scope})`.pipe(
          Effect.asVoid,
          Effect.catchTags({
            SqlError: cause => Effect.fail(new PreparationWriteError({ cause })),
          }),
        ),
      appendGoal: (userId, pathId, version, sessionId, scope, oralDate) => {
        const oralExamDate = Option.match(oralDate, {
          onNone: () => null,
          onSome: DateTime.formatIso,
        })

        return sql`INSERT INTO user_exam_goals (user_id,qualification_path_id,version,exam_session_id,access_scope,oral_exam_date) VALUES (${userId},${pathId},${version},${sessionId},${scope},${oralExamDate})`.pipe(
          Effect.asVoid,
          Effect.catchTags({
            SqlError: cause => Effect.fail(new PreparationWriteError({ cause })),
          }),
        )
      },
      select: (userId, pathId) =>
        Effect.gen(function* () {
          yield* sql`INSERT INTO user_path_selections (user_id,qualification_path_id) VALUES (${userId},${pathId}) ON CONFLICT (user_id) DO UPDATE SET qualification_path_id=EXCLUDED.qualification_path_id`
          yield* sql`UPDATE user_qualification_paths SET last_selected_at=clock_timestamp() WHERE user_id=${userId} AND qualification_path_id=${pathId}`
        }).pipe(
          Effect.catchTags({
            SqlError: cause => Effect.fail(new PreparationWriteError({ cause })),
          }),
        ),
      archive: (userId, pathId) =>
        Effect.gen(function* () {
          yield* sql`UPDATE user_qualification_paths SET archived_at=coalesce(archived_at,now()) WHERE user_id=${userId} AND qualification_path_id=${pathId}`

          const removed =
            yield* sql`DELETE FROM user_path_selections WHERE user_id=${userId} AND qualification_path_id=${pathId} RETURNING user_id`

          if (removed.length > 0) {
            yield* sql`INSERT INTO user_path_selections (user_id,qualification_path_id)
          SELECT user_id,qualification_path_id FROM user_qualification_paths WHERE user_id=${userId} AND archived_at IS NULL ORDER BY last_selected_at DESC,qualification_path_id LIMIT 1`
          }
        }).pipe(
          Effect.catchTags({
            SqlError: cause => Effect.fail(new PreparationWriteError({ cause })),
          }),
        ),
      restore: (userId, pathId) =>
        sql`UPDATE user_qualification_paths SET archived_at=NULL WHERE user_id=${userId} AND qualification_path_id=${pathId}`.pipe(
          Effect.asVoid,
          Effect.catchTags({
            SqlError: cause => Effect.fail(new PreparationWriteError({ cause })),
          }),
        ),
      extend: (userId, pathId) =>
        sql`UPDATE user_qualification_paths SET access_scope='both' WHERE user_id=${userId} AND qualification_path_id=${pathId}`.pipe(
          Effect.asVoid,
          Effect.catchTags({
            SqlError: cause => Effect.fail(new PreparationWriteError({ cause })),
          }),
        ),
    })
  }),
)
