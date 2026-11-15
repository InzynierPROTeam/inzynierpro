import { Effect, Layer, Logger, References, Tracer } from 'effect'
import { FetchHttpClient, HttpMiddleware, type HttpServerRequest } from 'effect/http'
import { OtlpLogger, OtlpMetrics, OtlpSerialization, OtlpTracer } from 'effect/observability'
import type { ProcessEnv } from '~api/lib/env.js'

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
const tracerLayer = (serviceName: string) =>
  Layer.effect(
    Tracer.Tracer,
    Effect.map(Effect.tracer, tracer =>
      tracer === Tracer.nativeTracer ? tracer : redactingTracer(tracer),
    ),
  ).pipe(Layer.provide(OtlpTracer.layerFromConfig({ resource: { serviceName } })))

/**
 * Exports traces, logs and metrics over OTLP when `OTEL_EXPORTER_OTLP_ENDPOINT` is set and
 * `OTEL_TRACES_EXPORTER` / `OTEL_LOGS_EXPORTER` / `OTEL_METRICS_EXPORTER` are `otlp`; otherwise
 * spans stay in memory. Each process has its own `serviceName`.
 * `stdoutLoggers` keep writing to stdout next to the OTLP exporter. Version and environment
 * come from `OTEL_SERVICE_VERSION` and `OTEL_RESOURCE_ATTRIBUTES` (ADR-0022).
 */
export const observabilityLayer = (
  serviceName: string,
  stdoutLoggers: ReadonlyArray<Logger.Logger<unknown, unknown>>,
) =>
  Layer.mergeAll(
    tracerLayer(serviceName),
    OtlpMetrics.layerFromConfig({ resource: { serviceName } }),
    // The OTLP logger joins the stdout loggers; without an endpoint only stdout remains.
    OtlpLogger.layerFromConfig({ resource: { serviceName } }).pipe(
      Layer.provideMerge(stdoutLoggers.length === 0 ? Layer.empty : Logger.layer(stdoutLoggers)),
    ),
  ).pipe(Layer.provide([OtlpSerialization.layerJson, FetchHttpClient.layer]))

/** Telemetry and log level of a backend process; production stdout logs are JSON lines. */
export const processTelemetryLayer = (
  serviceName: string,
  config: Pick<ProcessEnv, 'NODE_ENV' | 'LOG_LEVEL'>,
) =>
  Layer.mergeAll(
    observabilityLayer(serviceName, config.NODE_ENV === 'production' ? [Logger.consoleJson] : []),
    Layer.succeed(References.MinimumLogLevel, config.LOG_LEVEL),
  )
