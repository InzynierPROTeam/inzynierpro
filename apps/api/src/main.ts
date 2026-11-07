import { NodeRuntime } from '@effect/platform-node'
import { Layer } from 'effect'
import { HttpLive } from '~api/http.js'
import { EnvProviderLive } from '~api/lib/env-provider.js'

HttpLive.pipe(Layer.provide(EnvProviderLive), Layer.launch, NodeRuntime.runMain)
