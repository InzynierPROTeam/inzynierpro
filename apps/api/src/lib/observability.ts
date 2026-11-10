import { Effect, Layer, Logger, Tracer } from 'effect'
import { FetchHttpClient, HttpMiddleware, type HttpServerRequest } from 'effect/http'
import { OtlpLogger, OtlpSerialization, OtlpTracer } from 'effect/observability'

const serviceName = 'inzpro-api'

// Attributes that would identify a person or carry a credential never leave the process.
// `client.address` is the raw peer IP that Effect's HTTP tracer records.
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

// Health probes and CORS preflights would only add noise to traces.
export const untracedRequestsLayer = Layer.succeed(
  HttpMiddleware.TracerDisabledWhen,
  (request: HttpServerRequest.HttpServerRequest) =>
    request.method === 'OPTIONS' || request.url.startsWith('/api/v1/health-check'),
)

// The native tracer stays unwrapped: Effect skips span bookkeeping when it is active.
const tracerLayer = Layer.effect(
  Tracer.Tracer,
  Effect.map(Effect.tracer, tracer =>
    tracer === Tracer.nativeTracer ? tracer : redactingTracer(tracer),
  ),
).pipe(Layer.provide(OtlpTracer.layerFromConfig({ resource: { serviceName } })))

/**
 * Exports traces and logs over OTLP when `OTEL_EXPORTER_OTLP_ENDPOINT` is set and
 * `OTEL_TRACES_EXPORTER` / `OTEL_LOGS_EXPORTER` are `otlp`; otherwise spans stay in memory.
 * `stdoutLoggers` keep writing to stdout next to the OTLP exporter. Version and environment
 * come from `OTEL_SERVICE_VERSION` and `OTEL_RESOURCE_ATTRIBUTES` (ADR-0042).
 */
export const observabilityLayer = (stdoutLoggers: ReadonlyArray<Logger.Logger<unknown, unknown>>) =>
  Layer.mergeAll(
    tracerLayer,
    // The OTLP logger joins the stdout loggers; without an endpoint only stdout remains.
    OtlpLogger.layerFromConfig({ resource: { serviceName } }).pipe(
      Layer.provideMerge(stdoutLoggers.length === 0 ? Layer.empty : Logger.layer(stdoutLoggers)),
    ),
  ).pipe(Layer.provide([OtlpSerialization.layerJson, FetchHttpClient.layer]))
