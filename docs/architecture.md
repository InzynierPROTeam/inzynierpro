# Workspace architecture

Read this document before adding a workspace, moving shared code, or changing dependencies.
The implementation decisions are recorded in [ADR-0012](adr/0012-modular-monolith-and-data-ownership.md), [ADR-0014](adr/0014-shared-http-contracts-and-client.md) and [ADR-0015](adr/0015-monorepo-structure-toolchain-and-verification.md).

## Package responsibilities

Existing packages:

- `api-contracts`: public HTTP endpoints, requests, responses, and declared errors. Share JSON-compatible data schemas; keep backend implementation details in the API application.
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

- `utils`: environment-independent, product-independent functions and types. Examples include collection operations and formatting functions that receive locale and time zone as arguments. Keep React, browser APIs, and business concepts elsewhere.
- `browser-utils`: browser APIs such as cookies and storage. Access browser globals when a function runs, and distinguish a missing value from unavailable storage. React integration belongs in `react-utils`.
- `react-utils`: shared hooks, QueryClient factories, and React integrations. A browser QueryClient can be reused; server-side QueryClients must remain request-scoped. Separate web and native integrations through subpaths.
- `config`: public organization configuration such as branding, contact details, and supported locales. Environment variables, deployment settings, credentials, and environment loading stay with the application.
- `domain`: public business vocabulary, branded identifiers, and genuinely shared pure rules. Internal entities, authorization, use cases, repositories, and authoritative business decisions remain inside the owning API module.
- `ui`: shared web UI primitives based on shadcn and reusable custom UI. Receive data and callbacks; keep session fetching, endpoint calls, and application routes in the consumer. Its `theme.css` holds the design tokens; `email` reads that file and overrides only email-specific values, such as pixel sizes.
  Reserved for later: `mobile-ui` owns native controls when the mobile application needs them. Share suitable rules and data, while keeping platform controls separate.

The `mobile-ui` name has dependency rules but no empty scaffold. Application layers and integrations remain inside the API modules; environment loading remains inside each application.

## Dependency directions

The authoritative list of permitted workspace dependencies is [policy.ts](../packages/tools/src/oxlint/architecture-policy.ts). Each entry lists the dependencies a workspace may import; it is not a list of required dependencies. Self-imports and imports within the same workspace remain valid.

Applications compose packages. Packages never import applications. Client applications cannot import `db` or API source files, and applications do not import each other's sources. Universal packages remain independent of React, native platforms, and Node built-ins. `utils` and `config` are leaves of the workspace graph.

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

Use Effect's `DateTime`, `Clock`, `Duration` and related built-in modules for date/time creation, arithmetic, time-zone conversion and formatting. Keep locale and time-zone choices explicit at the consumer. Use Effect clocks for the current time rather than direct `new Date()` or `Date.now()` calls, and keep date formatting behind Effect date/time helpers.

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

The API and public domain vocabulary use five business modules: qualification-paths (shared path catalogue), exam-calendar (official targets), preparation (assignments, access and goals), learning-content (shared material) and study (personal learning read models). Public qualification-paths/exam-calendar catalogue groups and private preparation/study groups each have one http.ts. Learning-content exposes its internal repository. A configuration change uses one PostgreSQL transaction, an account lock and revalidation against the catalogue and calendar. Documents with personal progress are one user-specific HTTP request. Collection contracts share cursor pagination for clients and offset pagination for administration. Module migration files create the final initial tables directly; the first migration owns the shared timestamp trigger. ADR-0014 owns date and collection contracts; ADR-0025 owns onboarding behavior. Identifier syntax is enforced by the conventions plugin.

## Backend and contract convention checks

The conventions plugin also enforces SQL placement in API PostgreSQL readers/repositories, migrations and explicit seeds, including rejection of direct fixture SQL. It checks backend role filenames, one module http.ts naming, concept filenames without -id, semantic UUID schemas built from the shared Uuid, request schemas imported from requests.ts, and api-client action/request/response/error groups with an inferred req forwarded to the generated client. These checks run through the existing lint, pre-commit and CI commands.

Checks cover static syntax and imports. They do not prove authorization order, bounded SQL cardinality, module ownership or whether a query wrapper adds useful behavior; those remain review responsibilities under ADR-0012 and CODING_STANDARDS.md.

## Web authentication

Clients read session state through `GET /api/v1/identity/session`, which answers `Unauthenticated` (401) without a session. On the web, the shared `_maybeauthenticated` parent route reads the session once and distinguishes an authentication denial from a network or server failure; only a denial means there is no user. Its `_authenticated` and `_notauthenticated` children check the received context and redirect without another session query. Public onboarding belongs to this parent; the home page stays outside it and never reads the session.
