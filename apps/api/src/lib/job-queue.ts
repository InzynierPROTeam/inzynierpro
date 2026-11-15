import { Cause, Duration, Effect, Layer, Option, Predicate, Schedule, Schema, Tracer } from 'effect'
import { PersistedQueue } from 'effect/persistence'

/**
 * Durable background jobs on Effect's PersistedQueue with its PostgreSQL store (ADR-0012).
 * Delivery is at least once: a crash between a handler's success and its acknowledgement runs the
 * job again, so every handler makes its effect idempotent.
 */

// Effect's store creates and migrates this table itself, tracking its versions in
// `background_jobs_migrations`; our migrations never touch it.
export const jobQueueTable = 'background_jobs'

export type JobQueueStoreOptions = {
  // How often an idle worker looks for new jobs; offers in the same process wake it at once.
  readonly pollInterval?: Duration.Input
  // A job whose worker stopped refreshing its lock for this long is taken again.
  readonly lockExpiration?: Duration.Input
}

export const jobQueueStoreLayer = (options: JobQueueStoreOptions = {}) =>
  PersistedQueue.layer.pipe(
    Layer.provideMerge(
      PersistedQueue.layerStoreSql({
        tableName: jobQueueTable,
        pollInterval: options.pollInterval ?? Duration.seconds(1),
        lockExpiration: options.lockExpiration ?? Duration.minutes(2),
      }),
    ),
  )

// Lets the worker continue the trace of the request or script that offered the job.
const TraceParent = Schema.Struct({ traceId: Schema.String, spanId: Schema.String })

type JobEnvelope<A> = {
  readonly payload: A
  readonly trace: Option.Option<typeof TraceParent.Type>
}

const isStoreFailure = (cause: Cause.Cause<unknown>) =>
  cause.reasons.some(
    reason => Cause.isFailReason(reason) && Predicate.isTagged(reason.error, 'PersistedQueueError'),
  )

export type JobMetadata = {
  readonly id: string
  readonly attempts: number
}

export type JobQueueOptions<A> = {
  readonly name: string
  readonly schema: Schema.Codec<A, unknown>
  readonly maxAttempts: number
  // Delay before each retry, by attempt number; it defaults to an exponential back-off.
  readonly retrySchedule?: Schedule.Schedule<unknown, number>
}

export const makeJobQueue = Effect.fnUntraced(function* <A>(options: JobQueueOptions<A>) {
  const queue: PersistedQueue.PersistedQueue<JobEnvelope<A>> = yield* PersistedQueue.make({
    name: options.name,
    schema: Schema.Struct({ payload: options.schema, trace: Schema.OptionFromNullOr(TraceParent) }),
    maxAttempts: options.maxAttempts,
    retrySchedule:
      options.retrySchedule ??
      Schedule.min([
        Schedule.exponential(Duration.seconds(5)),
        Schedule.spaced(Duration.minutes(5)),
      ]),
  })

  const annotations = (job: JobMetadata) => ({
    'app.job.queue': options.name,
    'app.job.id': job.id,
    'app.job.attempt': job.attempts,
  })

  return {
    name: options.name,
    /**
     * Stores a job durably. A job with the `id` of an existing one is ignored, so a retried
     * offer never creates a second job.
     */
    offer: Effect.fn('JobQueue.offer', { attributes: { 'app.job.queue': options.name } })(
      function* (payload: A, offerOptions: { readonly id?: string } = {}) {
        const trace = yield* Effect.option(Effect.currentSpan).pipe(
          Effect.map(Option.map(span => ({ traceId: span.traceId, spanId: span.spanId }))),
        )

        const id = yield* queue.offer({ payload, trace }, { id: offerOptions.id })

        yield* Effect.logInfo('Background job offered').pipe(
          Effect.annotateLogs({ 'app.job.queue': options.name, 'app.job.id': id }),
        )

        return id
      },
    ),
    /**
     * Runs jobs one at a time until interrupted. A failed attempt is retried on the schedule
     * until `maxAttempts`; then the job stays in the table as failed with its last failure.
     * Logs carry only the queue, job id, attempt and failure, never the payload.
     */
    process: <E, R>(handler: (payload: A, job: JobMetadata) => Effect.Effect<void, E, R>) =>
      queue
        .take(({ payload, trace }, job) => {
          const run = handler(payload, job).pipe(
            Effect.tap(() => Effect.logInfo('Background job completed')),
            Effect.tapCause(cause =>
              // A stopping worker releases the job without counting the attempt: not a failure.
              Cause.hasInterruptsOnly(cause)
                ? Effect.logInfo('Background job released by a stopping worker')
                : job.attempts >= options.maxAttempts
                  ? Effect.logError('Background job failed permanently', cause)
                  : Effect.logWarning('Background job failed and will be retried', cause),
            ),
            Effect.annotateLogs(annotations(job)),
            Effect.withSpan('JobQueue.process', { kind: 'consumer', attributes: annotations(job) }),
          )

          return Option.match(trace, {
            onNone: () => run,
            onSome: parent => Effect.withParentSpan(run, Tracer.externalSpan(parent)),
          })
        })
        .pipe(
          // A handler failure is already logged and recorded on the job. A store failure, such as a
          // lost connection, is logged here and the worker tries again after a pause.
          Effect.catchCause(cause =>
            Cause.hasInterruptsOnly(cause)
              ? Effect.failCause(cause)
              : isStoreFailure(cause)
                ? Effect.logWarning('Background job queue is unavailable', cause).pipe(
                    Effect.annotateLogs('app.job.queue', options.name),
                    Effect.andThen(Effect.sleep(Duration.seconds(1))),
                  )
                : Effect.void,
          ),
          Effect.forever,
        ),
  }
})
