import { Cause, Duration, Effect, Layer, Option, Predicate, Schedule, Schema, Tracer } from 'effect'
import { PersistedQueue } from 'effect/persistence'

// EXTERNAL: Effect PersistedQueue delivers at least once; handlers must be idempotent across crash redelivery.

// EXTERNAL: Effect owns the background_jobs table and background_jobs_migrations; application migrations must not modify them.
export const jobQueueTable = 'background_jobs'

export type JobQueueStoreOptions = {
  readonly pollInterval?: Duration.Input
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
    process: <E, R>(handler: (payload: A, job: JobMetadata) => Effect.Effect<void, E, R>) =>
      queue
        .take(({ payload, trace }, job) => {
          const run = handler(payload, job).pipe(
            Effect.tap(() => Effect.logInfo('Background job completed')),
            Effect.tapCause(cause =>
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
