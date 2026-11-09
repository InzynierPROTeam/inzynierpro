import { createServer } from 'node:http'

import { NodeHttpServer } from '@effect/platform-node'
import { layer as AuthLayer } from '@inzpro/auth'
import { pgPoolLayer } from '@inzpro/db/pool'
import { layerResend as EmailResendLayer } from '@inzpro/email/email-service'
import { layer as RedisLayer } from '@inzpro/redis'
import { Effect, Layer } from 'effect'
import { SecureRandom } from 'effect/crypto'
import { HttpMiddleware, HttpRouter } from 'effect/http'
import { ApiLive } from '~api/api.js'
import { env, type Env } from '~api/lib/env.js'
import { ApiErrorMiddleware } from '~api/middleware/api-error.js'
import { RequestIdMiddleware } from '~api/middleware/request-id.js'
import { AuthHttp } from '~api/modules/identity/http.js'

export const httpServerLayer = (config: Env) =>
  HttpRouter.serve(
    Layer.mergeAll(
      ApiLive,
      AuthHttp,
      HttpRouter.cors({
        allowedOrigins: [config.PLATFORM_ORIGIN],
        allowedMethods: ['GET', 'POST'],
        // Effect's HTTP client adds trace headers to every request; the server continues the trace.
        allowedHeaders: ['content-type', 'traceparent', 'b3'],
        exposedHeaders: ['x-request-id', 'x-retry-after'],
        credentials: true,
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
    Layer.provide(
      AuthLayer({
        secret: config.BETTER_AUTH_SECRET,
        baseUrl: config.BETTER_AUTH_URL,
        trustedOrigins: [config.PLATFORM_ORIGIN],
        cookiesDomain: config.COOKIES_DOMAIN,
        google: config.GOOGLE,
      }),
    ),
    // Merged so tests can reach the connections, for example to simulate a Redis outage.
    Layer.provideMerge(
      Layer.mergeAll(
        pgPoolLayer({ url: config.DATABASE_URL }),
        RedisLayer({ url: config.REDIS_URL }),
      ),
    ),
    Layer.provide(SecureRandom.layerWebCrypto),
  )

export const HttpLive = Layer.unwrap(
  Effect.map(env, config =>
    httpServerLayer(config).pipe(
      Layer.provide(
        Layer.mergeAll(
          EmailResendLayer({ apiKey: config.RESEND_API_KEY }),
          NodeHttpServer.layer(createServer, { port: config.PORT }),
        ),
      ),
    ),
  ),
)
