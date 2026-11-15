import { databaseLayerFromConfig } from '@inzpro/db'
import { Data, Layer, Schema } from 'effect'
import { type JobQueueStoreOptions, jobQueueStoreLayer } from '~api/lib/job-queue.js'

// Each test owns a queue name, so workers of parallel tests never take each other's jobs.
export const uniqueQueue = () => `test-${crypto.randomUUID()}`

// A job store on the test database that notices new jobs quickly.
export const makeTestStoreLayer = (options: JobQueueStoreOptions = {}) =>
  jobQueueStoreLayer({ pollInterval: '50 millis', ...options }).pipe(
    Layer.provideMerge(databaseLayerFromConfig),
  )

// The payload of test-only jobs.
export const Greeting = Schema.Struct({ name: Schema.String })

// The failure of a test-only handler.
export class ControlledFailure extends Data.TaggedError('ControlledFailure') {}
