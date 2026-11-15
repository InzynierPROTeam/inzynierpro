# @inzpro/tools

Repository development checks and their regression tests.

**Runtime:** Node.js development tooling and CI.

Own lint infrastructure and architecture checks. Use existing tool capabilities first, and add custom checks only for concrete gaps. This package is not application runtime code.

## Usage

From the repository root:

```sh
pnpm lint
```

## TypeScript configs

`tsconfig/` holds the shared compiler settings every workspace extends: `library.json` (Node packages and the API), `library-dom.json` (React and browser packages) and `effect.json` (the Effect language service and ES2024 target, also used by the Vite and Playwright apps). Workspaces extend them as `@inzpro/tools/tsconfig/<name>.json`, resolved through the root `devDependency`. A workspace's own `tsconfig.json` adds only its `paths`, `types` and app-specific options. `${configDir}` keeps `outDir`, `rootDir` and `include` relative to the extending workspace.

## Dependencies

Follow the workspace dependency directions in [policy.ts](../tools/src/oxlint/architecture-policy.ts). The [architecture guide](../../docs/architecture.md) explains package placement, test exceptions, wildcard exports, and verification.

## Convention checks

The Oxlint conventions plugin checks infinite-query factory names, named component props, page composition from feature sections, gap-based spacing and read-only query dependencies. The rules and their adjacent regression tests define the exact accepted syntax. They run through the existing lint, pre-commit and CI commands.

Schema ownership (ADR-0027) uses `conventions/module-layers` and `conventions/domain-vocabulary`. The first requires API module files to sit in `domain/`, `application/`, `infrastructure/` or `http/` with that folder's file roles. It also rejects imports that point outward: only `http/` uses `@inzpro/api-contracts` and transport, only `infrastructure/` runs SQL (application may name `SqlError` types), and another module's `infrastructure/` is wired only from `http/`. The second rejects object schemas in `@inzpro/domain`. Tests may sit in any layer and are exempt from the import checks.

`conventions/module-layers` also permits imports from another API module only along `apiModuleDependencies` in the architecture policy, and `architecture-policy.test.ts` keeps the package and module graphs acyclic and the module list equal to the real module folders.

Names combine Oxlint's `unicorn/filename-case` (configured per path in `.oxlintrc.json`) with `conventions/directory-names` for folders, which Oxlint does not check. Its test cases cover kebab-case folders, camelCase feature folders and TanStack route folders.

Date enforcement uses `conventions/date-boundaries` for public ISO/null DTOs, shared client date helpers, private backend models and the absence of custom client serialization adapters. `conventions/prefer-duration` rejects common manual unit-conversion chains and raw numeric cache/timeout lifetimes. Tests are exempt from these two rules so they can exercise invalid representations and clock boundaries. The existing Effect DateTime rule still applies. Syntax checks complement response types and timezone/contract tests; they do not prove arbitrary nested JSON compatibility.

`conventions/no-module-defects` rejects `Effect.die`, `dieMessage`, `orDie` and `orDieWith` in API module `domain/`, `application/` and `http/` files, so expected outcomes such as a missing row become typed errors. Infrastructure keeps defects for broken invariants, and tests are exempt.

`conventions/prefer-cx` rejects ternaries directly inside JSX `className`, including ternaries nested in class-composition calls and template strings. Use `cx` with object conditions. Function-valued component props may still adapt a className callback without this rule inspecting its implementation.
