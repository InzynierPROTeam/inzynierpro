# Diagnostics and telemetry

## Diagnostics from the first slice

The first working slice already has request IDs, logs, error tracking and basic monitoring of the API and the durable queue, so a failed answer save or a stuck job can be traced before more features arrive.

Product analytics start on our own events and aggregates, with no session recording. We measure, among others, study start and completion, returns and save errors. Analytics never collect private note content.

## Error handling

An unexpected read or write failure is handled once, in the handler, before it becomes a generic HTTP 500: the original cause is logged and the current span is tagged with the error type. Log and span share the trace ID, which the client receives as `x-request-id`. There are no hand-made event names per error; the error tag and the operation's span name serve that role. The response never reveals database details, and the declared HTTP error is not logged again by global middleware. Business failures, such as access denial or a version conflict, are not infrastructure failures. Client errors outside a request, such as an idle PostgreSQL pool, keep their own context and full error.

## OTLP export

The backend exports traces and logs over OTLP through the built-in `effect/observability` modules, without `@opentelemetry/*` packages. Code stays vendor-neutral: endpoint, headers and resource attributes come from the standard `OTEL_*` variables. We start with Grafana Cloud in the EU region; changing vendor is a configuration change. Without an endpoint, spans stay in memory and logs go only to stdout. In production stdout keeps JSON logs as a fallback when export fails.

The observability layer lives in `apps/api`, because HTTP and worker are entry points of one application; each has its own `service.name`, and the version is the commit SHA. Shared packages only use `Effect.log` and spans; the process decides about export.

## Spans

Every HTTP request has a server span with `http.route` and status. Commands, queries, readers and PostgreSQL repositories are traced spans. SQL gets spans from `@effect/sql` with query text but no parameters. Pure domain functions have no spans. Attributes follow OpenTelemetry semantic conventions.

## Privacy

Telemetry may contain `user.id`. It never contains e-mail, full IP address, request or response bodies, SQL parameters, cookies, authorization headers, private note content, tokens or sign-in codes. The tracer strips attributes with sensitive names before export, including `client.address`. Logs do not pass through that filter, so sensitive values are never logged.

## Sampling, metrics and alerts

We keep every trace at first, and a child inherits its parent's decision from `traceparent`. Health checks and `OPTIONS` preflights are not traced. When the vendor limit is reached we move to tail sampling that keeps errors and slow requests. Grafana derives RED metrics from spans; custom metrics, including queue state, arrive with the worker. Browser telemetry needs a separate decision.

Grafana alerts cover the 5xx rate, p95 latency, a failing health check and missing incoming spans, and notify Telegram. They are configured in the Grafana UI at first; alerts as code are decided together with IaC (ADR-0017).
