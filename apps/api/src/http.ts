import { createServer } from 'node:http'

import { NodeHttpServer } from '@effect/platform-node'
import { layer as AuthLayer } from '@inzpro/auth'
import { databaseLayer } from '@inzpro/db'
import { pgPoolLayer } from '@inzpro/db/pool'
import { layerResend as EmailResendLayer } from '@inzpro/email/email-service'
import { layer as RedisLayer } from '@inzpro/redis'
import { Effect, Layer, Logger, References } from 'effect'
import { SecureRandom } from 'effect/crypto'
import { HttpRouter, HttpServer } from 'effect/http'
import { ApiLive } from '~api/api.js'
import { env, type Env } from '~api/lib/env.js'
import { observabilityLayer, untracedRequestsLayer } from '~api/lib/observability.js'
import { ApiErrorMiddleware } from '~api/middleware/api-error.js'
import { RequestIdMiddleware } from '~api/middleware/request-id.js'
import { SecureHeadersMiddleware } from '~api/middleware/secure-headers.js'
import { AuthHttp } from '~api/modules/identity/http.js'

export const httpServerLayer = (config: Env) =>
  HttpRouter.serve(
    Layer.mergeAll(
      ApiLive,
      AuthHttp,
      HttpRouter.cors({
        allowedOrigins: config.TRUSTED_ORIGINS,
        allowedMethods: ['GET', 'POST'],
        // Effect's HTTP client adds trace headers to every request; the server continues the trace.
        allowedHeaders: ['content-type', 'traceparent', 'b3'],
        exposedHeaders: ['x-request-id', 'x-retry-after'],
        credentials: true,
      }),
      HttpRouter.middleware(
        app => app.pipe(ApiErrorMiddleware, RequestIdMiddleware, SecureHeadersMiddleware),
        { global: true },
      ),
    ),
    { disableLogger: true },
  ).pipe(
    HttpServer.withLogAddress,
    Layer.provide(
      AuthLayer({
        secret: config.BETTER_AUTH_SECRET,
        baseUrl: config.BETTER_AUTH_URL,
        trustedOrigins: config.TRUSTED_ORIGINS,
        cookiesDomain: config.COOKIES_DOMAIN,
        google: config.GOOGLE,
      }),
    ),
    // Merged so tests can reach the connections, for example to simulate a Redis outage.
    Layer.provideMerge(
      Layer.mergeAll(
        pgPoolLayer({ url: config.DATABASE_URL }),
        databaseLayer({ url: config.DATABASE_URL }),
        RedisLayer({ url: config.REDIS_URL }),
      ),
    ),
    Layer.provide([SecureRandom.layerWebCrypto, untracedRequestsLayer]),
  )

export const HttpLive = Layer.unwrap(
  Effect.map(env, config =>
    httpServerLayer(config).pipe(
      Layer.provide(
        Layer.mergeAll(
          EmailResendLayer({ apiKey: config.RESEND_API_KEY }),
          NodeHttpServer.layer(createServer, { port: config.PORT }),
          // Production stdout logs are JSON lines; development keeps the readable default.
          observabilityLayer(config.NODE_ENV === 'production' ? [Logger.consoleJson] : []),
          Layer.succeed(References.MinimumLogLevel, config.LOG_LEVEL),
        ),
      ),
    ),
  ),
)
