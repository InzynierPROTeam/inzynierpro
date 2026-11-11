# Coding standards

Judgement calls for review. Mechanical rules live in Oxlint (`.oxlintrc.json`); this file covers what a linter cannot decide.

## Follow V1

When V1 (`~/Developer/inzynier-pro`) already solves the same problem (a form, an auth flow, a feature folder, a package), the V2 code mirrors its shape and naming. A deviation earns a one-line reason in the change: a V1 bug, a missing V2 dependency, or an Effect v4 API difference.

## Frontend features

A feature folder `apps/<app>/src/features/<feature>/` holds:

- `<Name>Page.tsx`: the page component a route renders directly (`component: SignInPage`).
- `components/`: components used only by this feature.
- `hooks/`: hooks used only by this feature. App-wide hooks live in `src/hooks/`.
- `actions.ts`: calls to external clients, such as the Better Auth client.
- `validation.ts`: schemas for search params and other feature input. Shared schemas live in `src/` or in `@inzpro/domain`.
- `utils.ts`: `getRouteApi` constants (`signInPageRouteApi`) and feature helpers.
- `types/`: request and response types derived from the client calls.

A helper with nothing feature-specific in it belongs in `src/utils/<name>.ts`.

Components read route state (search params, route context) through the feature's route API constant at the place that uses it. Props carry component inputs, not route state passed down the tree.

## Forms

Forms use TanStack `useForm` with `revalidateLogic()` and an Effect schema through `Schema.toStandardSchemaV1`, as in `features/auth/components/SignInForm.tsx`. Field state lives in the form, not in `useState`. Failed submissions surface through `toast.promise`; auth failures use `getAuthErrorMessage` from `@inzpro/auth-client/error`.

## Effect

- Failures flow through the Effect error channel: `Effect.tryPromise` at the promise boundary, then `catchTag`, `catchIf` or `option`. Absence is an `Option`, not `null`.
- A value used once stays inline at its call site. A module constant such as `const isEmail = Schema.is(Email)` earns its place only through reuse or a name that explains something the expression does not.

## Thin wrappers

Shared packages that adapt one layer to another stay thin: `@inzpro/queries` passes an api-client action to `effectQueryOptions`, nothing more. A function that only renames another call (`const currentSessionOptions = () => currentSessionQueryOptions(apiHttpClient)`) is inlined at its call sites.

## Decision sources

Issues define delivery scope and acceptance criteria; ADRs own lasting product and architecture decisions. Review the relevant source rather than maintaining another copy here:

- [ADR-0021](docs/adr/0021-module-interfaces-data-ownership-and-client-responsibilities.md): module ownership, CQRS and authentication/authorization responsibilities.
- [ADR-0024](docs/adr/0024-shared-http-contracts-and-client.md): HTTP contracts, dates, collection pagination, client requests and query keys.
- [ADR-0041](docs/adr/0041-configured-paths-goals-and-access.md): public onboarding, assignments, goals and access scope.
- [ADR-0010](docs/adr/0010-published-revisions-and-emergency-withdrawal.md): normalized answers and revision publication/immutability.
- [ADR-0003](docs/adr/0003-session-references-to-shared-revisions.md): session references and answer presentation order.
- [ADR-0035](docs/adr/0035-diagnostics-from-first-vertical-slice.md): error diagnostics and logging ownership.
- [ADR-0042](docs/adr/0042-otlp-telemetry-and-grafana-cloud.md): telemetry export, span naming and data kept out of telemetry.
- [ADR-0025](docs/adr/0025-monorepo-toolchain-and-verification.md): schema timestamps and verification tooling.

Mechanical conventions are enforced by the [Oxlint conventions plugin](packages/tools/src/oxlint/conventions/index.ts); its rules and regression cases define the checked syntax. Keep additional review guidance focused on decisions static checks cannot make.

## Language

Write source identifiers, comments, tests, technical sample data and documentation in English. Platform user-facing content, validation messages, SEO and public route paths are Polish; authentication route-group identifiers and HTTP contract field names remain technical identifiers. ADR prose is written in Polish. Keep proper names and existing public identifiers intact.

## Semantic primitives

Use concrete branded schemas for concurrency versions and meaningful quantities. Keep semantic types in catalogue options, request/response fields, service interfaces and query keys. Presentation drafts, arithmetic intermediates and loop indices may remain primitive; decode them at the domain boundary.

## Backend responsibilities

- A query operation owns authorization or composition for one read use case. A handler may call its reader directly when there is no application behavior to add. Create query files only when they do useful work.
- A command owns one intent, its domain decisions, transaction and concurrency order. Import and call the defining function directly, for example `archivePath(userId, pathId)`. Command aggregator objects are unnecessary facades. Keep different intents in separate functions rather than passing an action discriminator to a switch.
- A reader exposes purposeful lookups and bounded lists. Fetch a single assignment/document/session when one is needed. Keep a point lookup bounded with LIMIT 1 and rely on the appropriate unique keys/predicates for its cardinality. Authorization and idempotency checks use single-record lookups.
- A repository exposes persistence operations used by commands. Commands can also use readers when they need current data to decide a write.
- PostgreSQL adapters own SQL, row decoding and persistence conversion. Prepare input variables before interpolating SQL. Select flat columns and assemble nested objects in TypeScript. Use SQL joins, predicates, counts and limits for the requested read; keep JSON object/array construction out of SELECTs.
- Retrieve Effect services into local variables named after the concrete service: `preparationReader`, `preparationRepository`, `examCalendarReader`, `examCalendarRepository`. Keep those names across use cases, adapters and fixtures.
- Map an unexpected infrastructure failure in a handler with `logAndFailInternalServerError(message)` from `~api/lib/internal-server-error.js`: it logs the cause, tags the span with `error.type` and fails with HTTP 500. Do not log it by hand. Business failures keep their own responses.
- Log levels: `error` for failures someone must fix, `warn` for degraded operation (a fallback, a lost connection), `info` for lifecycle events, `debug` for diagnosis only. Requests themselves are not logged; their spans carry method, route, status and duration. Never put e-mail addresses, IP addresses, tokens, codes or note content into a log message or annotation.
- API integration tests exercise the real HTTP handlers and real adapters. Prepare fixtures through actual module repositories; assert behavior through the agreed public API/UI. Seed scripts may own fixture SQL. Test bodies do not implement independent persistence queries.

## Contract and persistence review

Check that a resource collection follows the pagination decision in ADR-0024, rather than mistaking bounded configuration values for a collection. Verify that clients can fetch subsequent pages and that filters and account identity participate in the appropriate cache keys.

Use the existing schema directly when it already expresses the complete request; extend its fields only when adding or changing fields. Preserve endpoint-derived request types instead of hiding a newly required field with assertions, Partial or optional fields.

Keep finite literal choices reusable: export named literals, then a readonly values tuple, then the schema consuming that tuple.

Generic transaction adapters preserve both rollback and the original operation failure while mapping infrastructure failures. Review this behavior independently of the adapter's error-handling syntax.
