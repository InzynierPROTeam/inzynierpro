import * as Cloudflare from '@alchemy.run/cloudflare'
import * as Alchemy from 'alchemy'
import { Effect } from 'effect'

import { readDeploymentConfig } from './config.ts'

const config = Effect.runSync(readDeploymentConfig(process.env))
const stage = process.env.ALCHEMY_STAGE

if (stage !== 'staging' && stage !== 'prod') {
  throw new Error('An explicit staging or prod stage is required')
}

export default Alchemy.Stack(
  'inzpro-platform',
  {
    providers: Cloudflare.providers(),
    state: Cloudflare.state({ accountId: config.accountId, workerName: 'inzpro-state' }),
  },
  Effect.gen(function* () {
    if ((yield* Alchemy.Stage) !== stage) {
      return yield* Effect.die(new Error('CLI stage must match ALCHEMY_STAGE'))
    }

    // Keep local build/preview on the official Cloudflare Vite plugin. Alchemy
    // uploads that exact output rather than adding a second Vite integration.
    const platform = yield* Cloudflare.Worker('Platform', {
      name: `inzpro-platform-${stage}`,
      main: './apps/platform/dist/server/index.js',
      bundle: false,
      assets: { directory: './apps/platform/dist/client', notFoundHandling: 'none' },
      compatibility: { date: '2025-09-25', flags: ['nodejs_compat'] },
      domain: config.platform.hostname,
      workersDev: { enabled: false, previewsEnabled: false },
      observability: { enabled: true },
    })

    return { url: platform.url }
  }),
)
