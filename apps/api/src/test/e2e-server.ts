import { appendFile, mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { dirname } from 'node:path'

import { NodeHttpServer, NodeRuntime } from '@effect/platform-node'
import { databaseLayerFromConfig } from '@inzpro/db'
import { layer as EmailLayer } from '@inzpro/email/email-service'
import type { EmailAdapter } from '@opencoredev/email-sdk'
import { memoryAdapter } from '@opencoredev/email-sdk/testing'
import { Config, Effect, Layer } from 'effect'
import { httpServerLayer } from '~api/http.js'
import { env } from '~api/lib/env.js'
import { fileStorageS3Layer } from '~api/modules/learning-content/infrastructure/file-storage.service.s3.js'
import { seedTechnicalCatalogue } from '~api/seed/technical-catalogue.js'

import { catalogueTestTime, fixedWallClockLayer } from './clock.js'

const outboxAdapter = (path: string): EmailAdapter => {
  const memory = memoryAdapter('e2e-outbox')

  return {
    ...memory,
    send: async (message, context) => {
      await appendFile(path, `${JSON.stringify({ to: message.to, text: message.text })}\n`)

      return memory.send(message, context)
    },
  }
}

const program = Effect.gen(function* () {
  const config = yield* env
  const outbox = yield* Config.String('E2E_OUTBOX')

  yield* Effect.promise(async () => {
    await mkdir(dirname(outbox), { recursive: true })
    await writeFile(outbox, '')
  })

  yield* seedTechnicalCatalogue.pipe(
    Effect.provide(
      Layer.mergeAll(databaseLayerFromConfig, fileStorageS3Layer(config.FILE_STORAGE)),
    ),
    Effect.scoped,
  )

  return yield* Layer.launch(
    httpServerLayer(config).pipe(
      Layer.provide(NodeHttpServer.layer(createServer, { port: config.PORT })),
      Layer.provide(EmailLayer(outboxAdapter(outbox))),
      Layer.provide(fixedWallClockLayer(catalogueTestTime)),
    ),
  )
})

NodeRuntime.runMain(program)
