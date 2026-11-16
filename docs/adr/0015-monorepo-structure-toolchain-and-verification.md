# Monorepo structure, toolchain and verification

## Applications and packages

The target applications are `apps/api`, `apps/platform` (the study app), `apps/admin`, `apps/web` (the public website) and `apps/mobile`. HTTP and worker are entry points of the same backend in `apps/api`. We start with the API and the platform; other applications and shared packages are created when actually needed. Contracts and the HTTP client have their own shared packages.

Clients share what they actually use: API contracts, the API client, shared validation and calculations, formatting and brand elements. Web and admin may share web components; mobile shares rules and data with native components. Packages appear with real sharing; no single UI implementation is forced on every platform.

Package responsibilities, dependency directions and exceptions are in [docs/architecture.md](../architecture.md); [architecture-policy.ts](../../packages/tools/src/oxlint/architecture-policy.ts) is the executable source of permitted dependencies.

## Toolchain

The base toolchain is pnpm, Turborepo, strict TypeScript, Oxlint, Oxfmt and Vitest. Shared configuration is extracted where several applications or packages use it.

Architecture rules are enforced from Foundation: names, imports through explicit module interfaces, permitted layer dependencies and no cycles. We use existing tool capabilities first and fill gaps with a small local Oxlint plugin, not a separate runner or dependency-graph tool. Checks have tests for allowed cases, violations and exceptions.

## Verification

Local `pnpm check` applies safe lint fixes and formatting first, then checks types, tests and build. `pnpm check:ci` runs the same checks without changing sources. A local hook runs fast checks on changed files. Pull requests, including `dev` to `main`, run the lighter `pnpm check:pr`: formatting, then lint and types in parallel on one runner. After merge, pushes to `dev` and `main` run the full verification and E2E before any deployment. A branch can temporarily contain a failing revision; staging and production retain the previous deployment when a gate fails. This deliberately trades earlier detection for lower GitHub Actions usage on the free plan. Changes confined to `docs/` skip CI and deployment; all files outside `docs/`, including README files, trigger normal verification. The dependency graph and cache reuse pure tasks; real PostgreSQL/Redis integration tests always execute on code pushes.

## Local services and tests

Local PostgreSQL and Redis share one Docker Compose configuration with repository commands for starting services and running migrations. Local, test and production settings are separate. Agents start in one shared working environment; isolated checkouts and environments are added when parallel work needs them.

API tests reuse module imports within a Vitest worker. Each file owns and closes its API and scoped connections; each test still owns unique accounts and queue names. Shared catalogue seeding runs once before the suite. Test helpers supply time and dependencies through layers rather than mutating process globals.

We test behaviour through explicit module interfaces. Pure rules have fast unit tests. Transactions, SQL adapters, auth and the job queue have integration tests against real PostgreSQL and Redis. Critical user flows have E2E tests. External providers are replaced by controlled adapters where repeatability requires it.

E2E tests use Playwright in Chromium against the production platform build served by the Cloudflare runtime and the real API, PostgreSQL and Redis. The API's E2E entry point writes sent e-mails to an outbox file instead of exposing test endpoints, and tests that do not exercise sign-in start from a session created through the API. The suite runs as a separate job blocking deployment on code pushes to `dev` and `main`; a test that passes only on retry fails it. Unit and integration coverage is published per workspace as information, without a blocking threshold.
