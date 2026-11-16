import { Effect, Layer, Logger, References, Tracer } from 'effect'
import { FetchHttpClient, HttpMiddleware, type HttpServerRequest } from 'effect/http'
import { OtlpLogger, OtlpMetrics, OtlpSerialization, OtlpTracer } from 'effect/observability'
import type { ProcessEnv } from '~api/lib/env.js'

// EXTERNAL: Effect records the raw peer IP in the client.address span attribute.
const sensitiveAttribute =
  /(^|\.)(email|password|token|secret|otp|cookie|authorization)$|^(client|network\.peer)\.address$/

export const isSensitiveAttribute = (key: string) => sensitiveAttribute.test(key)

export const redactingTracer = (tracer: Tracer.Tracer): Tracer.Tracer =>
  Tracer.make({
    span: options => {
      const span = tracer.span(options)
      const attribute = span.attribute.bind(span)

      span.attribute = (key, value) => {
        if (!isSensitiveAttribute(key)) {
          attribute(key, value)
        }
      }

      return span
    },
    context: tracer.context,
  })

export const untracedRequestsLayer = Layer.succeed(
  HttpMiddleware.TracerDisabledWhen,
  (request: HttpServerRequest.HttpServerRequest) =>
    request.method === 'OPTIONS' || request.url.startsWith('/api/v1/health-check'),
)

// EXTERNAL: Effect skips span bookkeeping for Tracer.nativeTracer; preserve its identity.
const tracerLayer = (serviceName: string) =>
  Layer.effect(
    Tracer.Tracer,
    Effect.map(Effect.tracer, tracer =>
      tracer === Tracer.nativeTracer ? tracer : redactingTracer(tracer),
    ),
  ).pipe(Layer.provide(OtlpTracer.layerFromConfig({ resource: { serviceName } })))

export const observabilityLayer = (
  serviceName: string,
  stdoutLoggers: ReadonlyArray<Logger.Logger<unknown, unknown>>,
) =>
  Layer.mergeAll(
    tracerLayer(serviceName),
    OtlpMetrics.layerFromConfig({ resource: { serviceName } }),
    OtlpLogger.layerFromConfig({ resource: { serviceName } }).pipe(
      Layer.provideMerge(stdoutLoggers.length === 0 ? Layer.empty : Logger.layer(stdoutLoggers)),
    ),
  ).pipe(Layer.provide([OtlpSerialization.layerJson, FetchHttpClient.layer]))

export const processTelemetryLayer = (
  serviceName: string,
  config: Pick<ProcessEnv, 'NODE_ENV' | 'LOG_LEVEL'>,
) =>
  Layer.mergeAll(
    observabilityLayer(serviceName, config.NODE_ENV === 'production' ? [Logger.consoleJson] : []),
    Layer.succeed(References.MinimumLogLevel, config.LOG_LEVEL),
  )
