import { Duration, Effect, Layer, Option, Schema } from 'effect'
import { SqlClient } from 'effect/sql'
import { jobQueueTable } from '~api/lib/job-queue.js'
import { BackgroundJobsReader } from '~api/modules/background-jobs/application/background-jobs.reader.js'
import { BackgroundJobsReadError } from '~api/modules/background-jobs/application/errors.js'

const BacklogRow = Schema.Struct({
  queueName: Schema.String,
  waiting: Schema.Int,
  running: Schema.Int,
  completed: Schema.Int,
  failed: Schema.Int,
  oldestWaitingSeconds: Schema.NullOr(Schema.Finite),
})

const FailedJobRow = Schema.Struct({
  queueName: Schema.String,
  id: Schema.String,
  attempts: Schema.Int,
  lastFailure: Schema.String,
})

export const BackgroundJobsReaderLive = Layer.effect(
  BackgroundJobsReader,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    // Effect's store writes its timestamps without a time zone in the session's local time.
    const jobs = sql(jobQueueTable)

    return BackgroundJobsReader.of({
      backlog:
        sql`SELECT queue_name, count(*) FILTER (WHERE state='pending' AND acquired_by IS NULL)::int AS waiting, count(*) FILTER (WHERE state='pending' AND acquired_by IS NOT NULL)::int AS running, count(*) FILTER (WHERE state='completed')::int AS completed, count(*) FILTER (WHERE state='failed')::int AS failed, extract(epoch FROM localtimestamp - min(visible_at) FILTER (WHERE state='pending' AND acquired_by IS NULL AND visible_at <= localtimestamp))::float8 AS oldest_waiting_seconds FROM ${jobs} GROUP BY queue_name ORDER BY queue_name`.pipe(
          Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(BacklogRow))),
          Effect.map(rows =>
            rows.map(row => ({
              queue: row.queueName,
              waiting: row.waiting,
              running: row.running,
              completed: row.completed,
              failed: row.failed,
              oldestWaitingAge: Option.fromNullOr(row.oldestWaitingSeconds).pipe(
                Option.map(Duration.seconds),
              ),
            })),
          ),
          Effect.mapError(cause => new BackgroundJobsReadError({ cause })),
          Effect.withSpan('BackgroundJobsReader.backlog'),
        ),
      failedJobs:
        sql`SELECT queue_name, id, attempts, split_part(coalesce(last_failure,''), E'\n', 1) AS last_failure FROM ${jobs} WHERE state='failed' ORDER BY updated_at DESC, sequence DESC LIMIT 20`.pipe(
          Effect.flatMap(Schema.decodeUnknownEffect(Schema.Array(FailedJobRow))),
          Effect.map(rows =>
            rows.map(row => ({
              queue: row.queueName,
              id: row.id,
              attempts: row.attempts,
              lastFailure: row.lastFailure,
            })),
          ),
          Effect.mapError(cause => new BackgroundJobsReadError({ cause })),
          Effect.withSpan('BackgroundJobsReader.failedJobs'),
        ),
    })
  }),
)
