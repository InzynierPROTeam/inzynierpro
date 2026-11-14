# Workspace architecture

Read this document before adding a workspace, moving shared code, or changing dependencies.
The implementation decisions are recorded in [ADR-0012](adr/0012-modular-monolith-and-data-ownership.md), [ADR-0014](adr/0014-shared-http-contracts-and-client.md) and [ADR-0015](adr/0015-monorepo-structure-toolchain-and-verification.md).

## Package responsibilities

Existing packages:

- `api-contracts`: public HTTP endpoints and every object that crosses HTTP: resources, requests, responses, pagination parameters and envelopes, and declared errors. Schemas are JSON-compatible and built from `domain` vocabulary; backend models stay in the API application (ADR-0027).
- `api-client`: Effect actions generated from the contracts, the Promise execution adapter, and reusable HTTP transport composition. Applications supply URLs, credentials, and request-specific adapters.
- `queries`: query keys and TanStack Query options. Receive the HTTP client from the consumer and preserve cancellation. Its README defines key hierarchies and invalidation.
- `db`: PostgreSQL connection infrastructure. Module-owned SQL, persistence rules, and migrations live in `apps/api`.
- `redis`: the Redis connection as a scoped Effect layer. Key layouts stay with the code that owns the data.
- `email`: React Email templates in the shared theme and the `EmailService` Effect service over email-sdk adapters (Resend in production, memory in tests). Deciding when to send stays with the owning module.
- `auth`: the Better Auth instance as an Effect service, built from PostgreSQL, Redis and `EmailService`. Endpoint mounting stays in `apps/api`.
- `auth-client`: the shared Better Auth client and its Polish error messages. The signed-in session is read through `api-client` and the shared contract.
- `testing`: reusable test adapters. Production application and package code must not import this package.
- `tools`: development checks and their regression tests. It is development infrastructure, not a runtime dependency of applications.

Shared foundations used by the platform setup:

- `utils`: environment-independent functions and types, including shared date formatting and Warsaw form/day helpers. Date helpers receive localization defaults from `config`. Reusable exam-access labels and client access predicates use literals from `domain`; authoritative authorization remains in the API. Keep React and browser APIs elsewhere.
- `browser-utils`: browser APIs such as cookies and storage. Access browser globals when a function runs, and distinguish a missing value from unavailable storage. React integration belongs in `react-utils`.
- `react-utils`: shared hooks, QueryClient factories, and React integrations. A browser QueryClient can be reused; server-side QueryClients must remain request-scoped. Separate web and native integrations through subpaths.
- `config`: public organization configuration such as branding, contact details, and supported locales. Environment variables, deployment settings, credentials, and environment loading stay with the application.
- `domain`: shared business vocabulary: branded identifiers, literal codes, value primitives (`UtcIsoDateTime`, `QuestionCount`, `PageLimit`, `Cursor`) and genuinely shared pure rules. It has no object schemas: HTTP shapes belong to `api-contracts`, and models, authorization, use cases, repositories and authoritative business decisions remain inside the owning API module (ADR-0027).
- `ui`: shared web UI primitives based on shadcn and reusable custom UI. Receive data and callbacks; keep session fetching, endpoint calls, and application routes in the consumer. Its `theme.css` holds the design tokens; `email` reads that file and overrides only email-specific values, such as pixel sizes.
  Reserved for later: `mobile-ui` owns native controls when the mobile application needs them. Share suitable rules and data, while keeping platform controls separate.

The `mobile-ui` name has dependency rules but no empty scaffold. Application layers and integrations remain inside the API modules; environment loading remains inside each application.

## Dependency directions

The authoritative list of permitted workspace dependencies is [policy.ts](../packages/tools/src/oxlint/architecture-policy.ts). Each entry lists the dependencies a workspace may import; it is not a list of required dependencies. Self-imports and imports within the same workspace remain valid.

Applications compose packages. Packages never import applications. The `e2e` application drives the platform and the API over HTTP and imports none of their sources. Client applications cannot import `db` or API source files, and applications do not import each other's sources. Universal packages remain independent of React, native platforms, and Node built-ins. `config` and `domain` are leaves; `utils` may depend on `config` for localization defaults and `domain` for shared vocabulary. Domain never imports utils, so helpers that consume domain literals cannot create a package cycle.

Tests named `*.test.*` or `*.spec.*`, and test support code in a workspace's `src/test` directory (test servers, fixtures), may use `testing`. Production code must not import that directory. The `testing` package may use its own adapters internally. Tests otherwise follow the same workspace dependency directions as production code. Production code must not import test files.

Declare runtime workspace dependencies in the consuming `package.json`. Test-only workspace dependencies belong in `devDependencies`. Hoisted development tools may remain in the root manifest.

## Imports and exports

Import across workspaces through package names, for example `@inzpro/queries/modules/health`. Relative imports within a workspace and its own TypeScript path alias are valid. Relative paths crossing into another workspace are rejected even when the dependency direction itself is allowed.

Keep broad exports such as `"./*": "./dist/*.js"` where the package exposes its contents. There is no per-file export allowlist to maintain. A wildcard export intentionally makes matching files public; it does not authorize forbidden dependencies. Import concrete subpaths rather than adding barrel files.

## Enforcement

Architecture checks run as part of Oxlint, without a separate command or dependency-graph service. The local [architecture plugin](../packages/tools/src/oxlint/architecture.ts) enforces the dependency policy, application isolation, package-name imports across workspaces, platform-library restrictions in universal packages, and test-only imports. It checks static import/export declarations, literal dynamic imports, CommonJS require calls and inline type imports. Computed runtime module names are outside static analysis.

The `architecture/no-reexports` rule rejects direct re-exports and exporting imported bindings; modules export their own declarations instead. The type-aware `typescript/no-deprecated` rule rejects deprecated API usage.

The built-in `import/no-cycle` rule checks file cycles. Package cycles include type-only imports; application cycle checks ignore erased type imports because generated router registrations refer back to their router types. Generated `*.gen.ts` files are outside the maintained-source rules and remain type-checked by their application.

Relative paths and workspace aliases are checked against source ownership without requiring a package build. TypeScript and the build remain responsible for resolving imports. A missing package does not become a valid implementation just because its dependency direction is permitted.

`pnpm lint`, `pnpm check` and the CI `pnpm check:ci` command all use these rules. Tests beside the plugin cover valid imports, violations, type syntax and cycle detection through the actual Oxlint CLI.

## Dates and canonical URLs

Public HTTP schemas and query caches contain JSON-compatible values: `UtcIsoDateTime` strings and `null`. Backend module models use `DateTimeUtc` and `Option`; SQL adapters and each module's `http/mappers.ts` own conversions. No custom SSR serialization adapters are needed. ADR-0014 defines these boundaries.

Use Effect's `DateTime`, `Clock`, `Duration` and related built-in modules for date/time creation, arithmetic, time-zone conversion and formatting. Shared `utils/date` helpers use Polish localization and Europe/Warsaw from `config` for display, form input and business days, independent of the device zone. Use Effect clocks for the current time rather than direct `new Date()` or `Date.now()` calls, and keep date formatting behind Effect date/time helpers.

The [conventions plugin](../packages/tools/src/oxlint/conventions/index.ts) enforces the mechanical part of [CODING_STANDARDS.md](../CODING_STANDARDS.md): hooks in `hooks/` folders, feature file names without the feature prefix, route state read through route APIs instead of spread into props, Effect instead of `try/catch`, and query modules that only wrap api-client actions.

The `anti-slop-effect/prefer-effect-datetime` Oxlint rule rejects native `Date` creation, calls, static API access and constructor aliases, plus `Intl.DateTimeFormat`. It also checks qualified globals and literal computed properties. Native date type annotations and shadowed local bindings remain valid. The rule does not rewrite code automatically because migrating to Effect can change types and execution semantics.

Canonical page URLs have exactly one trailing slash, including the root path. Canonical metadata removes search parameters and fragments. Asset URLs and API endpoint paths retain their own contracts.

## Changing the layout

1. Start reusable code in its owning application until its consumers and interface are clear.
2. When adding a package, choose one responsibility above or document a new one, add its policy entry, and write its README.
3. Give each README the package's purpose, runtime, exclusions, and an import example. Link to the policy for permitted dependencies rather than copying the dependency list.
4. Update dependency manifests and add a regression case for every new restriction or exception.
5. Run the architecture tests and the repository checks. Changes to a significant architectural decision also update the relevant ADR.

## Preparation modules

The API and public domain vocabulary use five business modules: qualification-paths (shared path catalogue), exam-calendar (official targets), preparation (assignments, access and goals), learning-content (shared material) and study (personal learning read models). Public qualification-paths/exam-calendar catalogue groups and private preparation/study groups each have one `http/handlers.ts`; module files sit in `domain/`, `application/`, `infrastructure/` and `http/` folders (ADR-0027). Learning-content exposes its internal repository. A configuration change uses one PostgreSQL transaction, an account lock and revalidation against the catalogue and calendar. Documents with personal progress are one user-specific HTTP request. Collection contracts share cursor pagination for clients and offset pagination for administration. Module migration files create the final initial tables directly; the first migration owns the shared timestamp trigger. ADR-0014 owns date and collection contracts; ADR-0025 owns onboarding behavior. Identifier syntax is enforced by the conventions plugin.

## Back navigation

Platform pages return with `components/BackLink.tsx` and a typed `fallback` link. `lib/back-navigation.ts` records, per browser history entry, the in-app entry the user came from: a push to another page comes from the current page, while search-only pushes and replacing redirects keep the existing origin. Entries are identified by the TanStack Router key in `history.state` and the map is kept in sessionStorage, so the URL stays clean and the origin survives reloads and back/forward. Only routes that declare `staticData.backLabel` are back targets, and that label names the link. A BackLink whose origin is a back target steps back through history, restoring scroll; otherwise (direct entry, new tab, sign-in) it follows its optional fallback or renders nothing.

## Backend and contract convention checks

The conventions plugin also enforces SQL placement in API PostgreSQL readers/repositories, migrations and explicit seeds, including rejection of direct fixture SQL. It checks backend role filenames, handler groups only in a module's `http/handlers.ts` or `http/<group>.handlers.ts`, module layer folders and their inward import direction (`module-layers`), the absence of object schemas in `domain` (`domain-vocabulary`), concept filenames without -id, semantic UUID schemas built from the shared Uuid, request schemas imported from requests.ts, and api-client action/request/response/error groups with an inferred req forwarded to the generated client. These checks run through the existing lint, pre-commit and CI commands.

Checks cover static syntax and imports. They do not prove that a model is declared independently of its DTO, authorization order, bounded SQL cardinality, module ownership or whether a query wrapper adds useful behavior; those remain review responsibilities under ADR-0012 and CODING_STANDARDS.md.

## Web authentication

Clients read session state through `GET /api/v1/identity/session`, which answers `Unauthenticated` (401) without a session. `_authenticated` protects the application shell, while `_notauthenticated` protects guest-only pages. Public `/zacznij` is outside those guards; its final step owns the authentication handoff. Authenticated `/pierwsze-kroki` and the profile remain outside `_onboarded` so users can configure or restore assignments.

`_onboarded` loads GET /preparation/paths with the configured five-assignment limit, then resolves the account-scoped client cookie against active assignments and persists a valid fallback. The backend never stores a client's selection. The authenticated context contains the saved cookie ID, without fetching assignments. The onboarded context contains the resolved assignment. Profile remains outside the onboarded guard and highlights its list using the saved ID; it never synchronizes selection while rendering. Selection changes invalidate the router so contexts refresh, without a cookie subscription. Profile and optional sidebar reads share the ordinary-query cache. Onboarded route APIs belong to the onboarding feature. `_writtenValid` and `_oralValid` check exam-part access inline before material reads. There are no expiry, demo or PRO guards in the current V2 scope. ADR-0025 owns client selection, capacity and assignment ordering.

`browser-utils/cookie` owns the client-readable cookie policy (`Secure`, `SameSite=Strict`, host-only, `Path=/`) and an Effect `Duration`-based `maxAge` contract, converted to seconds at the serialization boundary. `react-utils/tanstack-start/cookies` adapts it to TanStack Start request cookies and browser cookies; features supply only names and lifetimes. `_authenticated` uses selective SSR: same-origin, same-site and direct entries retain SSR, while cross-site or unclassified entries defer authentication and selection guards to the browser. This avoids treating an omitted Strict cookie as a missing selection and overwriting it with a fallback.

## Query presentation

The UI package owns the generic Suspense query/error-reset containers, with TanStack Query as a runtime dependency. Platform `components/SuspenseQueryBoundary.tsx` supplies loading, error and empty defaults using UI `Empty` primitives directly. Feature-specific boundaries can replace each fallback, as in the selected-specialization sidebar. Assignment responses include the structured specialization, qualification kind and scope so the sidebar renders a specialization title and variant description without parsing the full path name. The sidebar passes its query response directly to the selection component.

Written categories and oral material lists use the shared Item composition. `/nauka/kategoria/$id` reads one category through GET /study/paths/:qualificationPathId/documents/:documentId, independently of session preview. `/nauka/start` owns preview and the V1 search fields (`akt-prawny`, `obecny-akt-prawny`, `liczba-pytan`). GET /study/paths/:qualificationPathId/preview resolves an explicit document or the first/next document with published, nonwithdrawn questions on that path. An absent preview returns HTTP 200 with null, while authentication and access denial remain failures. Learning-session reads follow this nullable-success absence contract; category detail point lookups retain 404. Preview keys include account, path and selection; a saved question limit is presented only within the current backend settings. POST /study/paths/:qualificationPathId/sessions confirms a preview: under the account lock it revalidates access, the document and the requested count against current settings, refuses the start with `StudySessionAlreadyStarted` (409, carrying the session ID and current position) when the document has an unfinished session, and otherwise stores the current published revision of each selected question with a shuffled answer order. A refused count or a scope that changed since the preview returns `StaleSessionPreview` (409). After either refusal the client refreshes the path's study queries; an already started session is offered through a toast action that opens it. Restarting a session will be a separate endpoint. Written study has its own tables, separate from future oral sessions (ADR-0005): a partial unique index on `written_study_sessions` keeps one unfinished session per user, path and document, and each session stores the active UserExamGoal version and its `current_position`, which answering advances. Sessions reference revisions and answer IDs in `written_study_session_questions` and `written_study_session_answer_options`, never content copies. GET `.../latest-session` returns the most recently started session of the path, or of one document with `?documentId=`, with its status, progress and document; a document's unfinished session is always its latest. GET `.../sessions/:sessionId` returns status and progress (total, answered, percent, the question to continue from) without path or document, and `.../sessions/:sessionId/questions/:position` the question; all three return null for an absent or foreign session. As in V1, question reads include each option's correctness and the explanation so clients can show feedback optimistically; the backend still scores by answer ID. `/nauka/sesja/$sessionId/$questionNumber` composes a session-agnostic `SessionHeader` fed only by the session read and a question card fed only by the question read; answers are selectable `AnswerOption`s (`@inzpro/ui`) lettered by `@inzpro/utils/answer`, with letters hidden in narrow containers. The Start tile, the top of `/nauka` and the category card show the latest session: start, continue, or start again after it ended. Starting replaces the preview's history entry and moving between questions replaces the current one, so back returns to the page the preview was opened from. Opening `/nauka/start` for a category with an active session shows a notice linking to it instead of the preview. Session keys sit under `studyKeys.session(userId, pathId, sessionId)` inside the path group. Answering, completion and "Zacznij od nowa" belong to later tickets; the UI does not fabricate them.

Platform features separate written material, oral material, session setup and assignment management (`written`, `oral`, `learningSession`, `examPaths`). Assignment mutations have separate archive, restore and extend hooks. Both onboarding routes use their own route API and explicitly compose five independent step forms, without a route-detection hook or a mapped step renderer. A step initializes its local form from committed URL values and validates before writing its selection to the URL. Changing a committed parent selection clears dependent choices; merely editing or going back does not commit the local value. Only the final public step queries the optional session; its validated submission preserves the complete committed draft before sign-in. Prefetch components query the next step independently of field presentation. Ordinary catalogue queries keep one-page DTOs in cache; infinite queries use separate keys. The session step and its prefetch share a two-session page size.
