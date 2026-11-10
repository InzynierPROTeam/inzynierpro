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

## Domain files and backend operations

Domain files are named after the concept: `qualification-path.ts`, `reference-document.ts`, `user.ts`. Keep the identifier and any further public schemas for that concept together.

Backend operations follow CQRS in one PostgreSQL database. Use `*.query.ts`, `*.command.ts`, `*.policy.ts`, `*.reader.ts`, `*.repository.ts`, `*.reader.postgres.ts`, `*.repository.postgres.ts` and `*.rules.ts` for their corresponding responsibilities. Each module has one `http.ts`. Application operations authorize access before reading results; SQL and row decoding belong to PostgreSQL adapters. Keep pure rules independent of HTTP and SQL.

Explicit seeds live in `apps/api/src/seed/`, one file per dataset. A CLI entry point runs them; application modules do not import seed code.

For request schemas, inferred client request arguments and named query-key groups, follow [ADR-0024](docs/adr/0024-shared-http-contracts-and-client.md).

## Language

Write source code, comments, messages, tests, technical sample data and documentation in English. ADR prose is written in Polish. Keep proper names and existing public identifiers intact. Apply this convention when changing existing areas.

## API-client action layout and empty requests

Keep each action together with its types, in this order: action, `<Action>Request`, `<Action>Res`, `<Action>Error`. Any additional derived error types follow that action's error type. Finish one action's group before starting the next.

Every action declares `req` inferred from its endpoint. For an empty request, use `req: ActionRequest = {}`. Required requests have no default. Query option factories consistently receive `(httpClient, req)` and use the same typed default only for empty requests, so callers can write `checkHealthQueryOptions(httpClient)` while the normalized request still goes into both the action and cache key.

Retain the endpoint-derived annotation on defaulted arguments. If the contract later requires input, TypeScript must reject the `{}` default. Remove that default and update callers with the newly required request. Do not hide the error with assertions, `Partial`, optional required fields or untyped defaults.

Personal query factories receive `(httpClient, userId, req)` so account identity is an explicit cache dimension without becoming a client-controlled authorization field. Empty request defaults remain typed. General query factories keep `(httpClient, req)`.

## Semantic primitives and dates

Use concrete branded schemas for domain identifiers, concurrency versions and meaningful quantities. Keep brands in catalogue options, request/response fields, service interfaces and query keys. Do not replace a concrete ID with a generic UUID option. Presentation drafts, arithmetic intermediates and loop indices may remain primitive; decode them at the domain boundary.

All API timestamps use the single `ApiDateTime` codec and runtime type. HTTP values are canonical UTC ISO 8601 strings with milliseconds; decoding validates the timestamp and immediately yields a UTC Effect DateTime. The API accepts any valid time of day. Clients convert local date/time input to UTC and display instants in their own time zone. Domain-specific field names describe meaning; date roles do not introduce separate codecs or midnight constraints.

Mutable tables normally have created_at and updated_at. The first migration owns the reusable set_updated_at trigger function; each mutable table attaches a BEFORE UPDATE trigger. Append-only history normally has created_at only. Unused imports and variables are lint errors.

## Backend responsibilities

- HTTP owns authentication, decoding requests, encoding responses and mapping declared failures with inline `Effect.catchTags` on the handler operation. Each module owns specific read/write errors. Error schemas are listed at each endpoint.
- A query operation owns authorization or composition for one read use case. A handler may call its reader directly when there is no application behavior to add. Create query files only when they do useful work.
- A command owns one intent, its domain decisions, transaction and concurrency order. Import and call the defining function directly, for example `archivePath(userId, pathId)`. Command aggregator objects are unnecessary facades. Keep different intents in separate functions rather than passing an action discriminator to a switch.
- A reader exposes purposeful lookups and bounded lists. Fetch a single assignment/document/session when one is needed. Keep a point lookup bounded with LIMIT 1 and rely on the appropriate unique keys/predicates for its cardinality. Authorization and idempotency checks use single-record lookups.
- A repository exposes persistence operations used by commands. Commands can also use readers when they need current data to decide a write.
- PostgreSQL adapters own SQL, row decoding and persistence conversion. Prepare input variables before interpolating SQL. Select flat columns and assemble nested objects in TypeScript. Use SQL joins, predicates, counts and limits for the requested read; keep JSON object/array construction out of SELECTs.
- Retrieve Effect services into local variables named after the concrete service: `preparationReader`, `preparationRepository`, `examCalendarReader`, `examCalendarRepository`. Keep those names across use cases, adapters and fixtures.
- API integration tests exercise the real HTTP handlers and real adapters. Prepare fixtures through actual module repositories; assert behavior through the agreed public API/UI. Seed scripts may own fixture SQL. Test bodies do not implement independent persistence queries.

## Collection contracts

Every resource collection uses a paginated `{ data, meta }` response. Client-facing endpoints use `CursorPagination` and `CursorPaginatedResponse`; administration uses `OffsetPagination` and `OffsetPaginatedResponse`, from `@inzpro/domain/common/pagination`. Extend the shared request fields for filters, and pass the item schema to the shared response factory. Validate cursor type, bound page size, use stable unique ordering and fetch at most limit + 1. Apply pagination in SQL. Include filters and the complete request in query keys. Clients expose fetching subsequent pages; they do not silently stop at page one.

Separate collection results from unrelated resources: assigned paths are a page; selected path is its own lookup. Static enum choices and bounded scalar settings are configuration, not resource collections.

## Public onboarding and reusable schemas

Public catalogue GETs for specializations, dependent kinds/scopes and exam sessions have no authentication middleware. Personal assignment lookups and mutations stay in authenticated contract groups. The web wizard is public, preserves choices through login and requests personal hints only for a signed-in account.

Build concrete identifiers by applying a semantic brand to the shared `Uuid` schema. For finite literal sets, export named literal constants, then an exported readonly values tuple, then the schema using that tuple. Reuse an existing schema directly when it already expresses the complete request; extend its fields only when adding or changing fields.

## Failure diagnostics and question answers

Log unexpected storage/decoding failures once where the module maps them to a generic HTTP error. Preserve the original cause and the requestId supplied by middleware. Business rejections such as missing access or a stale goal remain ordinary typed responses. Framework middleware logs unhandled failures; avoid logging the same cause in every layer. Use inline catchTags for tagged recovery. Generic transaction adapters must preserve both rollback and the original operation error while mapping infrastructure failures.

QuestionAnswer is an entity owned by one question revision. Store answer text and correctness in normalized rows, with dedicated branded answer IDs. Answer entities have no global presentation position. Published revisions have three answers and exactly one correct answer; published answer content is immutable, including after withdrawal. Publishing a new revision creates its own answer identities.

Question details order answers by createdAt then id for a deterministic tie-breaker. Learning, mock-exam and repetition sessions shuffle answers when their question set is created and persist the chosen answer-ID order for resume, reload and history. Render labels from that session order. Assess submissions by answer ID and revision ownership, never by a displayed letter or array index. A new session may choose a new order; re-rendering or resuming the same session preserves its recorded order.
