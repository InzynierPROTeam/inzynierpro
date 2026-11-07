import { createServer } from 'node:http'

import { NodeHttpServer } from '@effect/platform-node'
import { Effect, Layer } from 'effect'
import { SecureRandom } from 'effect/crypto'
import { HttpMiddleware, HttpRouter } from 'effect/http'
import { ApiLive } from '~api/api.js'
import { env } from '~api/lib/env.js'
import { ApiErrorMiddleware } from '~api/middleware/api-error.js'
import { RequestIdMiddleware } from '~api/middleware/request-id.js'

export const httpServerLayer = (port: number, platformOrigin: string) =>
  HttpRouter.serve(
    Layer.mergeAll(
      ApiLive,
      HttpRouter.cors({
        allowedOrigins: [platformOrigin],
        allowedMethods: ['GET'],
        exposedHeaders: ['x-request-id'],
      }),
      HttpRouter.middleware(
        app => app.pipe(ApiErrorMiddleware, HttpMiddleware.logger, RequestIdMiddleware),
        {
          global: true,
        },
      ),
    ),
    { disableLogger: true },
  ).pipe(
    Layer.provide(SecureRandom.layerWebCrypto),
    Layer.provideMerge(NodeHttpServer.layer(createServer, { port })),
  )

export const HttpLive = Layer.unwrap(
  Effect.map(env, config => httpServerLayer(config.PORT, config.PLATFORM_ORIGIN)),
)
