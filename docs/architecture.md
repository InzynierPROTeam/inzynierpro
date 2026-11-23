# Workspace architecture

How the monorepo is split into workspaces and how they may depend on each other. Read it before adding a package, moving shared code or changing dependencies.

Decisions live in [ADR-0012](adr/0012-modular-monolith-and-data-ownership.md) (modules and data ownership), [ADR-0015](adr/0015-monorepo-structure-toolchain-and-verification.md) (monorepo and verification) and [ADR-0027](adr/0027-schema-ownership-and-module-layers.md) (schema ownership and module layers). Each package README describes its own API, runtime and usage.

Application behaviour has its own documents:

- [platform.md](platform.md): the web platform's authentication, route guards, assignment selection, back navigation and data loading.
- [written-study.md](written-study.md): written study sessions from preview to summary, including withdrawn questions.
- [oral-study.md](oral-study.md): the oral content model, its revision guards and the oral catalogue.
- [mock-exams.md](mock-exams.md): exam blueprints, the mock exam preview, starting an attempt and reading it.
- [rich-content.md](rich-content.md): the versioned rich content format, its validation and the web renderer.
- [background-jobs.md](background-jobs.md): durable background jobs, the worker process and its diagnosis.
- [deployment.md](deployment.md): images, CI/CD to staging and production through Dokploy, operator setup and backups.

## Packages

| Package         | Owns                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------ |
| `api-contracts` | HTTP endpoints and every object that crosses HTTP: resources, requests, responses, pagination, errors. |
| `api-client`    | Effect actions generated from the contracts, the Promise adapter and HTTP transport composition.       |
| `queries`       | Query keys and TanStack Query options over `api-client` actions.                                       |
| `domain`        | Shared vocabulary: branded IDs, literal codes, value primitives and pure rules. No object schemas.     |
| `rich-content`  | The versioned rich content schema, its validation and the shared renderer fixtures.                    |
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

[architecture-policy.ts](../packages/tools/src/oxlint/architecture-policy.ts) is the authoritative list of what each workspace, and each API module, may import. An entry permits a dependency; it does not require it. Policy tests reject cycles in both graphs; `conventions/module-layers` rejects API source files whose module is missing from the policy.

- Applications compose packages; packages never import applications, and applications never import each other.
- `e2e` drives the platform and the API over HTTP and imports none of their sources.
- Client applications import neither `db` nor API sources.
- Universal packages stay free of React, native platforms and Node built-ins.
- `config` and `domain` are leaves. `utils` may depend on `config` and `domain`; `domain` never depends on `utils`, so there is no cycle. `rich-content` depends only on `domain`, so the backend's modules, the contracts and clients share one content schema.
- Only tests (`*.test.*`, `*.spec.*`) and a workspace's `src/test` support code may use `testing`. Production code imports neither.
- Runtime workspace dependencies go in the consumer's `dependencies`, test-only ones in `devDependencies`. Hoisted development tools may stay in the root manifest.

## Imports and exports

Import across workspaces by package name and concrete subpath, for example `@inzpro/queries/modules/health/queries`. Relative paths into another workspace are rejected even when the dependency itself is allowed.

Packages keep broad exports such as `"./*": "./dist/*.js"`, with no per-file allowlist and no barrel files. Modules export their own declarations; re-exports are rejected.

## Enforcement

The checks run inside Oxlint, through `pnpm lint`, `pnpm check` and CI:

- The [architecture plugin](../packages/tools/src/oxlint/architecture.ts) enforces the dependency policy, package-name imports, platform restrictions and test-only imports. It reads static imports, literal dynamic imports, `require` and inline type imports; computed module names are out of its reach.
- The [conventions plugin](../packages/tools/src/oxlint/conventions/index.ts) enforces the mechanical part of [CODING_STANDARDS.md](../CODING_STANDARDS.md): feature file layout, Effect dates and durations, API module layers, SQL placement, schema homes and client action shapes. Its rules and test cases are the reference for what it checks.
- `conventions/module-layers` also limits imports between API modules to `apiModuleDependencies`, so module cycles cannot form even when no single file cycle exists, and rejects a module folder missing from the policy.
- Names: `unicorn/filename-case` keeps files kebab-case, app `.tsx` components PascalCase (acronyms allowed, as in `VerifyOTPPage.tsx`) and hooks `useX` camelCase; TanStack route files and migrations keep their framework names. `conventions/directory-names` keeps folders kebab-case, except camelCase app feature folders and TanStack route folders (`(group)`, `_pathless`, `$param`).
- `import/no-cycle` rejects file cycles. Package cycles count type-only imports; application cycles ignore them, because generated router files refer back to their router types.
- The generated `apps/platform/src/routeTree.gen.ts` has explicit lint exceptions and remains type-checked; other files receive no exemption from a `.gen.ts` suffix.

Static checks cannot judge whether a model is declared independently of its DTO, authorization order, bounded SQL cardinality, module ownership or whether a query wrapper earns its place. Review covers those under ADR-0012 and CODING_STANDARDS.md.

## API modules

The business modules are `qualification-paths` (shared path catalogue), `exam-calendar` (official exam sessions), `preparation` (assignments, access and goals), `learning-content` (shared material), `written-study` and `oral-study` (the two personal learning modes) and `mock-exams` (exam blueprints and written mock exam attempts). `learning` owns reusable session rules, review scheduling and shared models; it has no dependency on either mode. `daily-plan` owns the pure daily plan rules and model shared by both modes; it depends only on `learning`, and each mode keeps its own plan table and counting. `learning-xp` owns the append-only XP ledger and the week, month, exam-session and lifetime projections. Written study, oral self-assessments, mini-quiz checks and finished mock exams award XP through it in the action transaction. It also grants the one-off rewards: a command reports its achievements (a completed round, a reached streak, an ended session with an answer, a passed mock exam) and `learning-xp` awards the round reward and the badges they earn, then the total-XP badges, in the same transaction. Badges are XP events with a `badge_code`, so the ledger keeps them; the module depends only on `learning`. `streak` owns the account streak: the Europe/Warsaw daily answer count, its qualifying days and the current and longest streak. It depends only on `learning`; `written-study`, `oral-study` and `mock-exams` record their answers through it in the answer transaction. A mock exam records its final answers when the attempt is finished; draft answers never count. The module also owns streak bridges: their append-only ledger and balance. It spends them on a covered gap when the next day qualifies and grants the streak milestone itself; `written-study` and `oral-study` grant the round reward and `mock-exams` the passed-exam reward through it, in the same transaction. The oral mini-quiz stays inside `oral-study` because it updates that mode's review evidence and belongs to its session lifecycle. `mock-exams` records the final answers of a finished attempt as written learning events through `written-study`, which owns written review evidence; `written-study` never depends on `mock-exams`. Each mode owns its writes. Commands open one database transaction through `Transaction` from `apps/api/src/lib/transaction.ts`, which preserves the atomic learning action in ADR-0012 across the repositories of several modules without either mode depending on the other.

`profiles` owns the editable profile name, the private-profile setting and the public profile read. Both settings are Better Auth user fields, so its repository writes them through Better Auth, which refreshes the cached sessions; Better Auth's own `/update-user` route is disabled so names cannot bypass validation. The public profile composes total XP and badges from `learning-xp`, the current streak from `streak` and active paths from `preparation`, with their catalogue labels mapped through `qualification-paths`; another user's private profile reads as not found. `rankings` owns the ranking read model: it orders the `learning-xp` period projection, joined with the users' public names and photos, by total and then by who reached it first, and returns the top rows with the viewer's own row. It maps this and last week, this and last month, an exam session and all time to `learning-xp` period keys, and links a row to its profile through the `profiles` visibility rule. `identity` mounts authentication; the technical `health` and `background-jobs` modules own health and job diagnostics. The shared transaction service owns no tables; its port, PostgreSQL implementation, error and HTTP failure mapping stay together in `lib/transaction.ts`. Only this file may import `SqlClient` outside SQL adapters, migrations and seeds, and SQL statements remain forbidden there. Modules keep the fixed layer folders described in CODING_STANDARDS.md. A new module or dependency starts with its entry in `apiModuleDependencies`.

## File roles

The executable role catalogue lives in `packages/tools/src/oxlint/source-role-policy.ts`; `conventions/rules/file-roles.ts` applies it, and regression tests define accepted paths and framework exceptions. Module moves update that policy and the semantic checks together. Keeping a file kebab-case alone does not establish its role.

Contracts use a root `modules/<module>/api.ts`, with requests, responses and errors in role files or topic directories. An optional `endpoints/` directory contains endpoint declarations composed by `api.ts`. Client modules are flat `modules/<module>.ts` by default and may become `modules/<module>/<topic>.ts` when responsibilities justify grouping. Queries use `<module>/keys.ts` and `queries.ts`, optionally replacing the latter with `queries/<topic>.ts`. Domain vocabulary allows topic nesting inside `common/` and `modules/<module>/`. Package READMEs own the usage examples.

Choose a file or a directory for the same role, never both: `utils.ts` and `utils/session.ts` must not coexist. The same applies to a flat client module and its topic directory. Adjacent tests belong to their subject; shared fixture and builder code belongs in `test/` and stays unavailable to production imports. A source role creates no requirement for an empty file or directory.

### Platform ownership

Global application roles are `components/`, `hooks/`, `utils/`, `types/`, `lib/`, `config/`, `stores/`, `providers/`, `assets/`, `styles/` and `test/`. Their contents may be grouped recursively by topic. Existing route, layout and application entry files retain their framework-specific rules.

Features allow root `<Name>Page.tsx` files; a feature may have no page. Page components live only at that root, never under `components/` or another nested folder. A feature's `actions`, `validation`, `utils`, `types`, `config` and `stores` roles use either `<role>.ts` or `<role>/**/*.ts`. Components and hooks use recursive `components/` and `hooks/` directories, with PascalCase component names and `useX` hook names. Feature integrations, providers, assets, styles and shared test support use `lib/`, `providers/`, `assets/`, `styles/` and `test/` when needed.

Ownership decides location. A session helper or control remains in `learningSession` even when oral sessions, favourites and reviews consume it. Cross-feature imports are allowed and must remain acyclic. A genuinely application-wide helper belongs globally. `utils` holds calculations and transformations, `lib` adapts external libraries and systems, `config` holds configuration and `stores` holds shared state. Providers keep their context nearby. Local types remain with their consumer until sharing gives them an owner.

### Backend ownership

Modules retain `domain/`, `application/`, `infrastructure/` and `http/`. Topic subdirectories preserve those layer identities and import directions. Role suffixes continue to identify models, rules, commands, queries, policies, ports and adapters. Grouped HTTP handlers, mappers and error mappings stay in `http/`.

A domain event describes a fact in `domain/`; application event handlers and background jobs orchestrate existing use cases in `application/`. Infrastructure implements ports, with adapter kinds registered explicitly in the executable role policy. New transports, such as MCP, extend that policy when implemented and reuse application operations rather than copying business logic. Keep regular study, reviews and favourites in their owning mode while they share lifecycle and persistence.

### Extending the policy

The stable rules protect ownership, dependency direction, page placement and production/test separation. The role catalogue is extensible. When an implementation needs a distinct responsibility or adapter, update its role policy, semantic checks and positive/negative regression cases in the same change. The diagnostic points to this extension path. Do not disguise integration code as a utility to fit an existing filename. No file count or line-count threshold substitutes for reviewing responsibilities.

Source lint validates parsed file paths and contents and checks the current filesystem for file/folder role collisions. Non-source assets and empty directories are outside Oxlint parsing; their ownership remains a review responsibility. Regression cases must include untracked files and nested paths so new layouts do not silently bypass existing semantic checks. Framework and generator exceptions are explicit rather than available to any filename ending in `.gen.ts`.

### Bootstrap migrations

Bootstrap migrations define final tables, columns, indexes and constraints directly; local databases are recreated when the schema changes. An `ALTER TABLE` adding a cyclic foreign key, such as a current revision or a mock exam question's selected option, or a foreign key to a table created by a later migration, such as a written learning event's mock exam answer, is the narrow exception: both referenced tables must first exist. Bootstrap changes do not build a history of column additions or table reshaping. This policy does not govern later migrations of released databases with retained data.

The job table remains owned and migrated by Effect's queue store ([background-jobs.md](background-jobs.md)). The first migration owns the shared `set_updated_at` trigger function.

## URLs and dates

Canonical page URLs have exactly one trailing slash, the root included, and drop search parameters and fragments. Asset and API paths keep their own form.

Dates follow ADR-0014: `UtcIsoDateTime` strings and `null` over HTTP and in caches, `DateTimeUtc` and `Option` inside API modules, Warsaw-based helpers in `@inzpro/utils/date`.

## Adding or changing a package

1. Start reusable code in its owning application until its consumers and interface are clear.
2. Give a new package one responsibility from the table above, or add a row for a new one.
3. Add its entry to the architecture policy and a regression case for every new restriction or exception.
4. Write its README: purpose, runtime, what it excludes and an import example. Link to the policy rather than listing dependencies.
5. Run the architecture tests and `pnpm check`. A change to a significant decision also updates its ADR.
