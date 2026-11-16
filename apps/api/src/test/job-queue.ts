import { databaseLayerFromConfig } from '@inzpro/db'
import { Data, Layer, Schema } from 'effect'
import { type JobQueueStoreOptions, jobQueueStoreLayer } from '~api/lib/job-queue.js'

export const uniqueQueue = () => `test-${crypto.randomUUID()}`

export const makeTestStoreLayer = (options: JobQueueStoreOptions = {}) =>
  jobQueueStoreLayer({ pollInterval: '50 millis', ...options }).pipe(
    Layer.provideMerge(databaseLayerFromConfig),
  )

export const Greeting = Schema.Struct({ name: Schema.String })

export class ControlledFailure extends Data.TaggedError('ControlledFailure') {}
