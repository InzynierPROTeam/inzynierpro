# Modular monolith and data ownership

## One backend, two processes

The backend is one business system of modules with explicit responsibilities. An HTTP process serves clients and a separate worker process runs background work; both use the same modules, business rules and PostgreSQL database, and can be run and scaled separately. This supports background work without splitting the system into separate business services.

## Module interfaces

Each backend module holds its own domain rules, application operations, infrastructure implementations and transport, and exposes a small explicit interface to other modules. We follow the Clean Architecture direction, organized by business responsibility. ADR-0027 fixes the layer folders, their dependency direction and where each kind of schema lives; a module creates only the folders it needs and no pass-through classes.

A module owns writes to its data. Other modules use its interface instead of changing its private tables. The shared database keeps transactions and foreign keys. Cross-cutting dashboard and report reads use explicitly defined read models instead of reaching into other modules' private data.

All business operations go through the shared backend. Server code of web and admin may handle rendering and data fetching, but session creation, scoring, SRS, XP, publication and authorization belong to the backend. Clients may share validation and helper calculations; the backend enforces the final rules.

## CQRS and authorization

CQRS separates queries and commands in one PostgreSQL database. A query uses an explicit reader or read model; a command uses a repository and a transaction. HTTP authenticates and supplies the trusted identity. An application policy checks the active path assignment and the required written/oral scope before a result is read. The check reads PostgreSQL directly, so a completed archive or extension applies from the next request. Every later entry point acting for a user uses the same policy. Role conventions are in CODING_STANDARDS.md and the module list in docs/architecture.md.

## Atomic learning actions

Storing an answer, its history, session progress, SRS, goal completion and earned XP happens in one transaction, so a confirmed action leaves a consistent result. The transaction does more work, but the monolith's shared database lets it run through the data owners' interfaces. Rankings and other global aggregates may update in the background with a short delay.

## Durable jobs

Durable jobs start on PostgreSQL, with retries, idempotent handling and visible failures. A transactional outbox is used where a job must be created together with a business change. Jobs survive restarts, and a retry must never repeat a business effect. We evaluated the queue available in Effect first and use it: `PersistedQueue` with its PostgreSQL store provides claiming with `SKIP LOCKED`, lock expiry, retries with back-off and failed jobs kept with their last failure, so the current scope needs no separate broker or custom queue. Effect owns its job table and migrates it itself when a process builds the store; we do not copy its schema into our migrations, accepting that an `effect` upgrade may change the table on start. Delivery is at least once, so every handler makes its effect idempotent by the job ID. Tests run the real queue on PostgreSQL with test-only handlers to verify retries, restarts, a killed worker, idempotence and permanent failures, without a fictional product job; [background-jobs.md](../background-jobs.md) describes running and diagnosing the worker. Offering a job atomically with a business change remains to be verified on the first real job.
