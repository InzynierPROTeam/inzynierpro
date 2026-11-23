# Background jobs and the worker

How the backend runs durable background jobs, and how an operator starts the worker and diagnoses it. Decisions live in [ADR-0012](adr/0012-modular-monolith-and-data-ownership.md) (durable jobs), [ADR-0017](adr/0017-hosting-infrastructure-and-deployment.md) (deployment) and [ADR-0022](adr/0022-diagnostics-and-telemetry.md) (telemetry).

## How it works

The HTTP API and the worker are two entry points of one backend in `apps/api`: `src/main.ts` and `src/worker/main.ts`. They share modules, configuration (`src/lib/env.ts`) and telemetry (`src/lib/observability.ts`), and each exports under its own `service.name` (`inzpro-api`, `inzpro-worker`).

Jobs use Effect's `PersistedQueue` with its PostgreSQL store, wrapped by `src/lib/job-queue.ts`. There is no broker and no extra service:

- A job is a row in `background_jobs`, so it survives restarts of every process.
- A worker claims a job with `FOR UPDATE SKIP LOCKED` and keeps a lock on it while the handler runs. Several workers can run side by side.
- A failed attempt is retried after an exponential back-off until the queue's `maxAttempts`; then the job stays in the table as `failed` with its last failure. Failed jobs are never deleted automatically; completed ones are removed after 30 days.
- On SIGTERM the worker interrupts the running handler and releases its job without counting the attempt. If a worker dies without releasing, the next worker takes the job once the lock expires (two minutes), and the lost attempt counts.
- Delivery is at least once. A handler must make its effect idempotent, keyed by the job ID, which stays the same on every delivery, for example with a unique key and `ON CONFLICT DO NOTHING`. Offering a job with an explicit `id` that already exists is ignored while that job is still in the table, that is, for 30 days after it completed.
- A job keeps the trace of the operation that offered it: the worker's `JobQueue.process` span continues that trace, so an API request ID (the trace ID) leads to the jobs it created. This correlation needs the OTLP exporter: logs exported over OTLP carry the trace ID, while the production stdout JSON logs do not.

The tests in `src/lib/job-queue.test.ts` run the real queue on PostgreSQL with test-only handlers: retries, a restart after a graceful stop, a worker process killed while it holds a job, idempotent effects and trace correlation.

### The job table belongs to Effect

`background_jobs` is not created by our migrations. Effect's store creates and upgrades it with its own versioned migrations, tracked in `background_jobs_migrations`, whenever a process builds the store: the API, which offers jobs, the worker and `worker:status`. Concurrent starts are safe, because Effect's migrator locks its migrations table. An upgrade of `effect` can therefore change this table when the first process starts after a deployment, so read the `PersistedQueue` changes in its changelog before upgrading. Our migrations never touch these two tables.

## Queues

- `mock-exam-attempt-deadlines` (`mock-exams`): finishes a mock exam attempt at its deadline when nobody returns to it ([mock-exams.md](mock-exams.md#clock-and-timeout)).

## Adding a queue

A module that needs background work:

1. Declares its payload schema in `domain/` and a queue service in `application/` built with `makeJobQueue` (name, schema, `maxAttempts`, optionally `retrySchedule`).
2. Offers jobs from its commands, optionally with a `delay` measured by the database clock. A handler receives the payload and `{ id, attempts }`, and makes its effect idempotent by the job ID.
3. Is wired in `src/worker/worker.ts`: its layers merged into `BackgroundJobsLive` and its `process` loop forked in `WorkerLive`.

Backlog reports, the gauge and `worker:status` cover every queue in the table, so they need no change. Payloads and failures are stored in the table and failures are logged, so they must not contain secrets or private content: pass IDs and load the data in the handler. A payload that no longer matches its schema, for example after a schema change, fails at once with the decoding error as its last failure, and that error can quote the stored values; with ID-only payloads it quotes only IDs.

## Running locally

With development services up and migrations applied:

```sh
pnpm --filter @inzpro/api dev:worker
```

The worker checks that it can read the queue table before starting cleanup and job processing. A failed check stops startup instead of repeatedly polling an unavailable schema. The worker logs `Worker started`; with `LOG_LEVEL=Debug` it also logs the backlog of each queue every minute. Check the queues from another terminal:

```sh
pnpm --filter @inzpro/api worker:status
```

## Deployment

The image builds both processes from `apps/api/Dockerfile`: the default target runs migrations and the API, and `--target worker` runs `node dist/worker/main.js` without an HTTP health check. The worker needs only `NODE_ENV`, `LOG_LEVEL`, `DATABASE_URL` and the optional `OTEL_*` variables. `worker:status` runs in the worker image as `node dist/worker/status.js`.

## Diagnosis

Every job log line carries `app.job.queue`, `app.job.id` and `app.job.attempt`, and failures add the error. Payloads are never logged.

- **Backlog:** `worker:status` logs `Background job backlog` for each queue, with waiting, running, completed and failed counts and how long the longest-ready job has waited for a worker (a retry counts from the end of its delay). Every minute the worker exports the same values as the `app.background_jobs` gauge by queue and state when `OTEL_METRICS_EXPORTER=otlp`, and logs them at debug level. A queue whose rows were all removed stops being reported, and its gauge keeps the last value. A growing `waiting` count or a long wait means no worker is taking jobs; a growing `failed` count means a handler keeps failing.
- **A failed job:** `worker:status` lists the latest failed jobs of all queues with their attempts and the first line of the last failure. Search the logs for the job ID for every attempt, or its trace for the spans of each attempt and of the operation that offered it.
- **A stuck job:** `running` stays above zero while no `JobQueue.process` span ends. Stopping that worker releases the job; a killed worker's job is taken again after the lock expires. A worker killed during the last allowed attempt cannot retry it: a running worker of that queue marks the job failed with `Lock expired after final attempt` once the lock expires.
- **SQL:** `SELECT queue_name, id, state, attempts, last_failure, updated_at FROM background_jobs ORDER BY sequence DESC LIMIT 20;`. To run a failed job again after fixing its cause: `UPDATE background_jobs SET state = 'pending', attempts = 0, acquired_at = NULL, acquired_by = NULL, visible_at = localtimestamp WHERE id = '<job id>' AND queue_name = '<queue>';`.
- **Missing queue table:** `relation "background_jobs" does not exist` concerns Effect's queue schema, so rerunning application migrations does not create it. If `background_jobs_migrations` records completed migrations while the queue table is missing, Effect skips recreating it. A partial schema reset can leave this inconsistent state. For disposable local development data, stop the API and worker and recreate the PostgreSQL volume, then run application migrations and the technical seed before restarting the processes. Keep Redis's separate volume. For retained data, investigate and restore the queue schema and its migration history together before restarting; do not clear migration records on a live database.
