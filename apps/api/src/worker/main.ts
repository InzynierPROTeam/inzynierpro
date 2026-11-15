import { NodeRuntime } from '@effect/platform-node'
import { Layer } from 'effect'
import { EnvProviderLive } from '~api/lib/env-provider.js'
import { WorkerLive } from '~api/worker/worker.js'

WorkerLive.pipe(Layer.provide(EnvProviderLive), Layer.launch, NodeRuntime.runMain)
