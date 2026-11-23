# Coding standards

Judgement calls for review. Mechanical rules live in Oxlint (`.oxlintrc.json`); this file covers what a linter cannot decide.

## Follow V1

When V1 (`~/Developer/inzynier-pro`) already solves the same problem (a form, an auth flow, a feature folder, a package), the V2 code mirrors its shape and naming. A deviation earns a one-line reason in the change: a V1 bug, a missing V2 dependency, or an Effect v4 API difference.

## Frontend features

Place code with its business owner. Feature-owned helpers and controls may be imported by other features without becoming global. Keep cross-feature imports acyclic. A helper with nothing feature-specific belongs in app-level utilities; an adapter to an external library or system belongs in `lib`. Types stay with their consumer unless sharing justifies extracting them.

The [architecture guide](docs/architecture.md#file-roles) describes feature/global roles, recursive grouping, page placement and role extension. The executable role policy and regression cases own mechanical path restrictions. Create only roles with content.
Components read route state (search params, route context) through the feature's route API constant at the place that uses it. Props carry component inputs, not route state passed down the tree.

A query or mutation hook runs in the lowest component that renders its data or triggers it, and that component owns the branches the data decides (an ended session's menu item, a footer action). A parent renders such a child without props when the child can read its inputs from the route itself.

An event handler longer than a single call goes in a named `const` in the component body (`const startSession = () => toast.promise(...)`), and the JSX passes it by name (`onClick={startSession}`). A one-line arrow such as `onClick={() => void selectPath(path.id)}` may stay inline.

Compose conditional classes inside `cx`. Within `cx`, prefer ternaries or logical expressions (`condition && className`, `!condition && className`); this argument style is a review preference, and other supported forms, including objects, remain allowed by lint.

## Forms

Forms use TanStack `useForm` with `revalidateLogic()` and an Effect schema through `Schema.toStandardSchemaV1`, as in `features/auth/components/SignInForm.tsx`. Field state lives in the form, not in `useState`. Failed submissions surface through `toast.promise`; auth failures use `getAuthErrorMessage` from `@inzpro/auth-client/error`.

## Effect

- Prefer Effect modules when they cover the operation. Express time intervals and lifetimes with `Duration`, converting units only at external boundaries rather than using manual unit arithmetic.
- Failures flow through the Effect error channel: `Effect.tryPromise` at the promise boundary, then `catchTag`, `catchIf` or `option`. Internal absence is an `Option`; public HTTP DTOs and client query caches use JSON-compatible values, including `null`.
- A value used once stays inline at its call site. A module constant such as `const isEmail = Schema.is(Email)` earns its place only through reuse or a name that explains something the expression does not.

## Dates

Public DTOs, query caches and router context preserve `UtcIsoDateTime` strings and `null`. Backend commands, readers and repositories use private module models with `DateTimeUtc` and `Option`; SQL adapters and `http/mappers.ts` own representation changes. Client form/display/day helpers belong in `@inzpro/utils/date` and use Europe/Warsaw independently of the device zone. Native Date is interop only. The date-boundaries, prefer-duration and Effect DateTime lint rules enforce these conventions; ADR-0014 owns the complete policy and DST behavior.

## Thin wrappers

Shared packages that adapt one layer to another stay thin: `@inzpro/queries` passes an api-client action to `effectQueryOptions`, nothing more. A function that only renames another call (`const currentSessionOptions = () => currentSessionQueryOptions(apiHttpClient)`) is inlined at its call sites.

## Decision sources

Issues define delivery scope and acceptance criteria; ADRs own lasting product and architecture decisions. Review the relevant source rather than maintaining another copy here:

- [ADR-0012](docs/adr/0012-modular-monolith-and-data-ownership.md): module ownership, CQRS, authorization policies and atomic learning actions.
- [ADR-0027](docs/adr/0027-schema-ownership-and-module-layers.md): schema ownership, module layer folders and dependency direction.
- [ADR-0014](docs/adr/0014-shared-http-contracts-and-client.md): HTTP contracts, dates, collection pagination and personal caching. Client actions and query keys follow the `api-client` and `queries` package READMEs.
- [ADR-0025](docs/adr/0025-configured-paths-goals-and-access.md): public onboarding, assignments, goals and access scope.
- [ADR-0003](docs/adr/0003-shared-revisions-publication-and-withdrawal.md): normalized answers, session references, revision publication and withdrawal.
- [ADR-0002](docs/adr/0002-study-session-lifecycle.md): session rules and answer presentation order.
- [ADR-0022](docs/adr/0022-diagnostics-and-telemetry.md): error diagnostics, logging, telemetry export, spans and data kept out of telemetry.
- [ADR-0026](docs/adr/0026-api-rate-limiting.md): rate-limit tiers, keys and behaviour during a Redis outage.
- [ADR-0015](docs/adr/0015-monorepo-structure-toolchain-and-verification.md): verification tooling and test strategy.

Mechanical conventions are enforced by the [Oxlint conventions plugin](packages/tools/src/oxlint/conventions/index.ts); its rules and regression cases define the checked syntax. Keep additional review guidance focused on decisions static checks cannot make.

## Language

Polish is for UI text, validation feedback shown by applications, e-mails, SEO, public route paths, educational content and development catalogue data displayed as product content. HTTP API error codes and technical message fields are English; clients map typed errors to Polish presentation instead of displaying raw API messages. Identifiers, comments, test descriptions, purely technical fixtures, documentation, ADRs, the glossary and issues are English. User-visible seed labels use realistic names. Route-group identifiers and HTTP contract field names are technical identifiers. Keep proper names (PIIB, IARP, InżynierPRO) and existing public identifiers intact. Glossary entries carry the Polish UI term beside the English one.

## Comments

Default to comment-free code. Names, types, structure and tests express our own behaviour, including business rules, transactions, cache invalidation and navigation choices. Internal models, reader/repository ports and exported functions earn no automatic documentation. Put lasting design decisions in their owning ADR. Remove narration, paraphrases, section banners and commented-out code; a small rename is preferable to an explanation.

Source prose is limited to these explicit exceptions, checked by `conventions/comment-policy`:

- `EXTERNAL:` explains a verified limitation or workaround imposed by a named library, platform or protocol, or cites the provenance of externally sourced seed data. It is not a label for our own implementation decisions.
- `CONTRACT:` in `@inzpro/api-contracts` defines genuinely ambiguous public HTTP semantics, such as the meaning of `null`. It does not retell domain rules, endpoint names or field types.
- `SAFETY:` supplies required evidence for a type assertion; `TESTID:` explains why an accessible selector cannot identify an element.
- `TODO:` or `TODO(#issue):` names concrete unfinished work.

Keep exceptions short and local. Review their substance: adding a prefix does not make narration acceptable. Tool directives (including justified lint suppressions), compiler annotations and required legal notices retain their native syntax. Comment-shaped test fixtures are data; generated and vendored sources remain owned by their generator or upstream. The lint rule never auto-deletes comments.

## Semantic primitives

Use concrete branded schemas for concurrency versions and meaningful quantities. Keep semantic types in catalogue options, request/response fields, service interfaces and query keys. Presentation drafts, arithmetic intermediates and loop indices may remain primitive; decode them at the domain boundary.

## Where a schema goes

Every schema has one home ([ADR-0027](docs/adr/0027-schema-ownership-and-module-layers.md)). Ask in order:

1. **Does it cross HTTP as an object** (resource, request, response, pagination envelope, transport error)? It goes in `@inzpro/api-contracts/src/modules/<module>/{requests,responses,errors}.ts` or the corresponding role directory, or `utils/` when every module shares it.
2. **Is it a single value or pure rule that both clients and the backend need** (branded ID, literal code, value primitive, limit, version step)? It goes in `@inzpro/domain`. That package has no object schemas.
3. **Otherwise it is private to the owning API module**:
   - a model (`DateTimeUtc`, `Option`), business rule or business error goes in `domain/`;
   - a command, query, policy, reader or repository port, or a read/write error goes in `application/`;
   - a SQL row stays private inside its `infrastructure/*.postgres.ts` adapter;
   - DTO⇄model conversion goes in `http/mappers.ts`, and module failure → contract error mapping goes in `http/errors.ts`.

A model never spreads DTO fields, and a row never chains through `Model.fields`. Declare fields from vocabulary instead. Decode rows straight into the model only when the columns match it one to one. A model without rich values can be returned as its DTO without a mapper.

An API module keeps its models and rules in `domain/`, use cases and ports in `application/`, concrete adapters in `infrastructure/` and transport in `http/`. Topic nesting preserves that direction. Create only layers with content. The [architecture guide](docs/architecture.md#backend-ownership) describes role extension; the conventions plugin owns exact filename grammar.

Tests sit beside the code they cover. Another module is importable only when `apiModuleDependencies` in the architecture policy permits it. The `conventions/module-layers` and `conventions/domain-vocabulary` lint rules enforce placement and direction.

## Backend responsibilities

- A query operation owns authorization or composition for one read use case. A handler may call its reader directly when there is no application behavior to add. Create query files only when they do useful work.
- A policy only authorizes: it reads the caller's access, never locks, writes or checks business state, and fails with a permission error. `requirePathAccess` is the shared one; other rules belong in `domain/`.
- A command owns one intent, its domain decisions, transaction and concurrency order. It opens the transaction with `Transaction.run` from `~api/lib/transaction.js`; repositories expose persistence operations only. Import and call the defining function directly, for example `archivePath(userId, pathId)`. Command aggregator objects are unnecessary facades. Keep different intents in separate functions rather than passing an action discriminator to a switch.
- A reader exposes purposeful lookups and bounded lists. Fetch a single assignment/document/session when one is needed. Keep a point lookup bounded with LIMIT 1 and rely on the appropriate unique keys/predicates for its cardinality. Authorization and idempotency checks use single-record lookups.
- A repository exposes persistence operations used by commands. Commands can also use readers when they need current data to decide a write.
- PostgreSQL adapters own SQL, row decoding and persistence conversion. Prepare input variables before interpolating SQL. Select flat columns and assemble nested objects in TypeScript. Use SQL joins, predicates, counts and limits for the requested read; keep JSON object/array construction out of SELECTs.
- Retrieve Effect services into local variables named after the concrete service: `preparationReader`, `preparationRepository`, `examCalendarReader`, `examCalendarRepository`. Keep those names across use cases, adapters and fixtures.
- A handler maps a module's specific failures with an inline `Effect.catchTags` that refers to the module's `http/errors.ts`, so every endpoint returns the same contract error and message. A business failure maps to a failed contract-error Effect (`PathPermissionDenied: () => pathAccessDenied`); an infrastructure failure maps to a bound `logAndFailInternalServerError` (`PreparationReadError: failPreparationRead`). Failures shared by all modules live in `~api/lib`, such as `invalidCursor`. Another module's failures use that module's `http/errors.ts`.
- Map an unexpected infrastructure failure with `logAndFailInternalServerError(message)` from `~api/lib/internal-server-error.js`, bound once in `http/errors.ts` (`failPreparationRead`): it logs the cause, tags the span with `error.type` and fails with HTTP 500. Do not log it by hand. Business failures keep their own responses.
- A handler starts with its rate limit: `limitByClient(publicReadLimit)` for anonymous endpoints, `limitByUser(accountReadLimit)` or `limitByUser(accountWriteLimit)` for signed-in ones, and declares `RateLimitExceeded` in its contract. A new tier needs a reason in ADR-0026.
- A handler group reads its services per request (`StudyReader.use(...)`, or a query/command that yields them) and does not provide them itself. Its `handlers.ts` exports `<Module>RequestServices` with the `...Live` layers the handlers need, and `ApiLive` passes all of them to `HttpRouter.provideRequest` after the groups. Providing them on a group layer type-checks but never reaches a handler.
- Log levels: `error` for failures someone must fix, `warn` for degraded operation (a fallback, a lost connection), `info` for lifecycle events, `debug` for diagnosis only. HTTP request completion is logged at info with method, path without query parameters, status and duration; spans retain the matching request context. Never put e-mail addresses, IP addresses, tokens, codes or note content into a log message or annotation. Span attributes follow OpenTelemetry semantic conventions; our own attributes take the `app.` prefix.
- API integration tests exercise the real HTTP handlers and real adapters. Prepare fixtures through actual module repositories; assert behavior through the agreed public API/UI. Seed scripts may own fixture SQL. Test bodies do not implement independent persistence queries.

## Testing

ADR-0015 sets the strategy; this section is how to apply it. Name tests after behaviour in English and use glossary terms.

| What changes                                                         | Test it with                                                                              |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| A pure rule or policy (`*.rules.ts`, `*.policy.ts`, schema messages) | A unit test beside it. Supply services through layers with in-memory values, never mocks. |
| An API endpoint, SQL adapter, auth or rate limit                     | An integration test through `startTestApi` against real PostgreSQL and Redis.             |
| A client action, query or React hook in a package                    | A test beside it with the scoped HTTP test server from `@inzpro/testing`.                 |
| A UI component with its own logic (state, branching, side effects)   | A behaviour test beside it. A pure styling wrapper over shadcn or Base UI gets no test.   |
| A user flow across pages: sign-in, onboarding, guards, study         | An E2E test in `apps/e2e`.                                                                |

Data and isolation:

- Every test creates its own account with a unique e-mail. Tests never truncate tables or depend on order, so files and workers run in parallel against one database.
- Test bodies and fixtures write no SQL. The only exception is a file in `apps/api/src/test/sql/` listed with its reason in `testSqlFiles` of the `conventions/backend-boundaries` lint rule, such as the PostgreSQL catalogue read behind the path reset table inventory. A new entry needs a check that repositories cannot express.
- The catalogue comes from the idempotent technical seed. Test-specific content goes through module repositories (`apps/api/src/test/{content,preparation,written-learning,oral-learning}-fixtures.ts`); test bodies write no SQL.
- Business time is fixed (`catalogueTestTime`), so exam sessions do not expire under the suite.

E2E:

- Select by role and Polish accessible name, as a user reads the page (`getByRole('button', { name: 'Zaloguj się' })`). A `data-testid` needs a comment explaining why no accessible name fits.
- Sign in through the UI only when signing in is part of the behaviour under test, as in sign-in or guest onboarding. Other tests start from the `signedIn` or `onboarded` fixtures, which sign in through the API and share the session cookie.
- Read sign-in codes from the outbox file; never add test-only endpoints to the API.
- Assert what the user sees and where they land, not request payloads or internal state.
- A flaky test fails CI: CI retries a failed test once only to record its trace, and a test that passes on retry still fails the run. Fix the cause (usually a missing web-first assertion) rather than raising retries or timeouts.

Coverage is reported per workspace in the CI job summary. It informs review; no threshold blocks a change.

## Contract and persistence review

Check that a resource collection follows the pagination decision in ADR-0014, rather than mistaking bounded configuration values for a collection. Verify that clients can fetch subsequent pages and that filters and account identity participate in the appropriate cache keys.

Use the existing schema directly when it already expresses the complete request; extend its fields only when adding or changing fields. Preserve endpoint-derived request types instead of hiding a newly required field with assertions, Partial or optional fields.

Keep finite literal choices reusable: export named literals, then a readonly values tuple, then the schema consuming that tuple.

Mutable tables usually have `created_at` and `updated_at`; append-only history has only `created_at`. The first migration defines the shared `set_updated_at` function, and every mutable table attaches a `BEFORE UPDATE` trigger. Application timestamps are `timestamptz(3)`. Choose a table's columns by its real lifecycle.

The `Transaction` adapter preserves both rollback and the original operation failure, and maps only its own SQL failure to `TransactionError`, which handlers map with `failTransaction`. Review this behavior independently of the adapter's error-handling syntax.
