# Monorepo structure, toolchain and verification

## Applications and packages

The target applications are `apps/api`, `apps/platform` (the study app), `apps/admin`, `apps/web` (the public website) and `apps/mobile`. HTTP and worker are entry points of the same backend in `apps/api`. We start with the API and the platform; other applications and shared packages are created when actually needed. Contracts and the HTTP client have their own shared packages.

Clients share what they actually use: API contracts, the API client, shared validation and calculations, formatting and brand elements. Web and admin may share web components; mobile shares rules and data with native components. Packages appear with real sharing; no single UI implementation is forced on every platform.

Package responsibilities, dependency directions and exceptions are in [docs/architecture.md](../architecture.md); [architecture-policy.ts](../../packages/tools/src/oxlint/architecture-policy.ts) is the executable source of permitted dependencies.

## Toolchain

The base toolchain is pnpm, Turborepo, strict TypeScript, Oxlint, Oxfmt and Vitest. Shared configuration is extracted where several applications or packages use it.

Architecture rules are enforced from Foundation: names, imports through explicit module interfaces, permitted layer dependencies and no cycles. We use existing tool capabilities first and fill gaps with a small local Oxlint plugin, not a separate runner or dependency-graph tool. Checks have tests for allowed cases, violations and exceptions.

## Verification

Local `pnpm check` applies safe lint fixes and formatting first, then checks types, tests and build. `pnpm check:ci` runs the same checks without changing sources. A local hook runs fast checks on changed files; CI is the mandatory quality gate that runs the full required set before changes merge, using the dependency graph and cache. Not every commit runs the full build and all integration tests.

## Local services and tests

Local PostgreSQL and Redis share one Docker Compose configuration with repository commands for starting services and running migrations. Local, test and production settings are separate. Agents start in one shared working environment; isolated checkouts and environments are added when parallel work needs them.

We test behaviour through explicit module interfaces. Pure rules have fast unit tests. Transactions, SQL adapters, auth and the job queue have integration tests against real PostgreSQL and Redis. Critical user flows have E2E tests. External providers are replaced by controlled adapters where repeatability requires it.
