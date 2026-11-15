# Workspace architecture

How the monorepo is split into workspaces and how they may depend on each other. Read it before adding a package, moving shared code or changing dependencies.

Decisions live in [ADR-0012](adr/0012-modular-monolith-and-data-ownership.md) (modules and data ownership), [ADR-0015](adr/0015-monorepo-structure-toolchain-and-verification.md) (monorepo and verification) and [ADR-0027](adr/0027-schema-ownership-and-module-layers.md) (schema ownership and module layers). Each package README describes its own API, runtime and usage.

Application behaviour has its own documents:

- [platform.md](platform.md): the web platform's authentication, route guards, assignment selection, back navigation and data loading.
- [written-study.md](written-study.md): written study sessions from preview to summary, including withdrawn questions.
- [background-jobs.md](background-jobs.md): durable background jobs, the worker process and its diagnosis.

## Packages

| Package         | Owns                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------ |
| `api-contracts` | HTTP endpoints and every object that crosses HTTP: resources, requests, responses, pagination, errors. |
| `api-client`    | Effect actions generated from the contracts, the Promise adapter and HTTP transport composition.       |
| `queries`       | Query keys and TanStack Query options over `api-client` actions.                                       |
| `domain`        | Shared vocabulary: branded IDs, literal codes, value primitives and pure rules. No object schemas.     |
| `utils`         | Environment-independent helpers, including Warsaw date helpers and exam-access labels.                 |
| `browser-utils` | Browser APIs such as cookies and storage.                                                              |
| `react-utils`   | Shared hooks, QueryClient factories and React integrations, split into web and native subpaths.        |
| `ui`            | Shared web UI on shadcn and Base UI, plus the design tokens in its theme.                              |
| `config`        | Public organization configuration: branding, contact details, locales.                                 |
| `db`            | The PostgreSQL connection. SQL, persistence rules and migrations stay in `apps/api` modules.           |
| `redis`         | The Redis connection as a scoped Effect layer. Key layouts stay with the owning code.                  |
| `email`         | React Email templates and the `EmailService`. The owning module decides when to send.                  |
| `auth`          | The Better Auth instance as an Effect service. Endpoint mounting stays in `apps/api`.                  |
| `auth-client`   | The shared Better Auth client and its Polish error messages.                                           |
| `testing`       | Reusable test adapters, for tests only.                                                                |
| `tools`         | Development checks, including the Oxlint plugins, and their regression tests.                          |

`mobile-ui` is reserved for native controls; it has dependency rules but no scaffold yet.

Environment variables, credentials and environment loading always stay in the application. A server-side QueryClient is created per request; a browser one may be reused.

## Dependencies

[architecture-policy.ts](../packages/tools/src/oxlint/architecture-policy.ts) is the authoritative list of what each workspace, and each API module, may import. An entry permits a dependency; it does not require it. A policy test rejects cycles in both graphs and requires every API module folder to be listed.

- Applications compose packages; packages never import applications, and applications never import each other.
- `e2e` drives the platform and the API over HTTP and imports none of their sources.
- Client applications import neither `db` nor API sources.
- Universal packages stay free of React, native platforms and Node built-ins.
- `config` and `domain` are leaves. `utils` may depend on `config` and `domain`; `domain` never depends on `utils`, so there is no cycle.
- Only tests (`*.test.*`, `*.spec.*`) and a workspace's `src/test` support code may use `testing`. Production code imports neither.
- Runtime workspace dependencies go in the consumer's `dependencies`, test-only ones in `devDependencies`. Hoisted development tools may stay in the root manifest.

## Imports and exports

Import across workspaces by package name and concrete subpath, for example `@inzpro/queries/modules/health`. Relative paths into another workspace are rejected even when the dependency itself is allowed.

Packages keep broad exports such as `"./*": "./dist/*.js"`, with no per-file allowlist and no barrel files. Modules export their own declarations; re-exports are rejected.

## Enforcement

The checks run inside Oxlint, through `pnpm lint`, `pnpm check` and CI:

- The [architecture plugin](../packages/tools/src/oxlint/architecture.ts) enforces the dependency policy, package-name imports, platform restrictions and test-only imports. It reads static imports, literal dynamic imports, `require` and inline type imports; computed module names are out of its reach.
- The [conventions plugin](../packages/tools/src/oxlint/conventions/index.ts) enforces the mechanical part of [CODING_STANDARDS.md](../CODING_STANDARDS.md): feature file layout, Effect dates and durations, API module layers, SQL placement, schema homes and client action shapes. Its rules and test cases are the reference for what it checks.
- `conventions/module-layers` also limits imports between API modules to `apiModuleDependencies`, so module cycles cannot form even when no single file cycle exists, and rejects a module folder missing from the policy.
- Names: `unicorn/filename-case` keeps files kebab-case, app `.tsx` components PascalCase (acronyms allowed, as in `VerifyOTPPage.tsx`) and hooks `useX` camelCase; TanStack route files and migrations keep their framework names. `conventions/directory-names` keeps folders kebab-case, except camelCase app feature folders and TanStack route folders (`(group)`, `_pathless`, `$param`).
- `import/no-cycle` rejects file cycles. Package cycles count type-only imports; application cycles ignore them, because generated router files refer back to their router types.
- Generated `*.gen.ts` files are exempt from source rules but still type-checked.

Static checks cannot judge whether a model is declared independently of its DTO, authorization order, bounded SQL cardinality, module ownership or whether a query wrapper earns its place. Review covers those under ADR-0012 and CODING_STANDARDS.md.

## API modules

The API has five business modules: `qualification-paths` (shared path catalogue), `exam-calendar` (official exam sessions), `preparation` (assignments, access and goals), `learning-content` (shared material) and `study` (personal learning). `identity` mounts authentication, and the technical `health` and `background-jobs` modules own the health check and job diagnostics; the generic queue lives in `src/lib/job-queue.ts`. Each keeps its files in `domain/`, `application/`, `infrastructure/` and `http/` folders, as CODING_STANDARDS.md describes. Personal learning depends on shared data, never the reverse. A new module, or a new edge between modules, starts with its entry in `apiModuleDependencies`.

Module migrations create their final tables directly, so a schema change edits the module's migration and local databases are recreated. The job table is the exception: Effect's queue store creates and migrates it itself ([background-jobs.md](background-jobs.md)). The first migration owns the shared `set_updated_at` trigger function.

## URLs and dates

Canonical page URLs have exactly one trailing slash, the root included, and drop search parameters and fragments. Asset and API paths keep their own form.

Dates follow ADR-0014: `UtcIsoDateTime` strings and `null` over HTTP and in caches, `DateTimeUtc` and `Option` inside API modules, Warsaw-based helpers in `@inzpro/utils/date`.

## Adding or changing a package

1. Start reusable code in its owning application until its consumers and interface are clear.
2. Give a new package one responsibility from the table above, or add a row for a new one.
3. Add its entry to the architecture policy and a regression case for every new restriction or exception.
4. Write its README: purpose, runtime, what it excludes and an import example. Link to the policy rather than listing dependencies.
5. Run the architecture tests and `pnpm check`. A change to a significant decision also updates its ADR.
