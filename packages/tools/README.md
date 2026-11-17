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

`conventions/comment-policy` rejects ordinary source prose, including JSDoc and JSX comments. It permits only explicit exceptions from [the Comments policy](../../CODING_STANDARDS.md#comments), native tool directives and legal notices. `CONTRACT:` is restricted to HTTP contract sources. Exceptions still require semantic review; the rule neither judges their truth nor deletes comments. It runs through the existing lint, pre-commit and CI commands.

The Oxlint conventions plugin checks infinite-query factory names, named component props, page composition from feature sections, gap-based spacing and read-only query dependencies. The rules and their adjacent regression tests define the exact accepted syntax. They run through the existing lint, pre-commit and CI commands.

Schema ownership (ADR-0027) uses `conventions/module-layers` and `conventions/domain-vocabulary`. The first requires API module files to sit in `domain/`, `application/`, `infrastructure/` or `http/` with that folder's file roles. It also rejects imports that point outward: only `http/` uses `@inzpro/api-contracts` and transport, only `infrastructure/` runs SQL (application may name `SqlError` types), and another module's `infrastructure/` is wired only from `http/`. The second rejects object schemas in `@inzpro/domain`. Tests may sit in any layer and are exempt from the import checks.

`conventions/module-layers` also permits imports from another API module only along `apiModuleDependencies` in the architecture policy, and `architecture-policy.test.ts` keeps the package and module graphs acyclic; module registration is enforced by lint on the API files.

The lint integration test uses a self-contained temporary workspace with synthetic manifests, TypeScript configuration and source probes owned by this package. It reads no other workspace source tree or configuration. Package tests use the ordinary Turbo task and package-local inputs; real application files are checked by the repository lint command.

Names combine Oxlint's `unicorn/filename-case` (configured per path in `.oxlintrc.json`) with `conventions/directory-names` for folders, which Oxlint does not check. Its test cases cover kebab-case folders, camelCase feature folders and TanStack route folders.

Date enforcement uses `conventions/date-boundaries` for public ISO/null DTOs, shared client date helpers, private backend models and the absence of custom client serialization adapters. `conventions/prefer-duration` rejects common manual unit-conversion chains and raw numeric cache/timeout lifetimes. Tests are exempt from these two rules so they can exercise invalid representations and clock boundaries. The existing Effect DateTime rule still applies. Syntax checks complement response types and timezone/contract tests; they do not prove arbitrary nested JSON compatibility.

`conventions/no-module-defects` rejects `Effect.die`, `dieMessage`, `orDie` and `orDieWith` in API module `domain/`, `application/` and `http/` files, so expected outcomes such as a missing row become typed errors. Infrastructure keeps defects for broken invariants, and tests are exempt.

`conventions/prefer-cx` rejects ternaries directly inside JSX `className`, including ternaries nested in class-composition calls and template strings. Use `cx` for conditional classes; ternaries, logical expressions and object conditions inside `cx` are allowed. Function-valued component props may still adapt a className callback without this rule inspecting its implementation.

`conventions/file-roles` reads the extensible [source-role policy](src/oxlint/source-role-policy.ts). Platform global roles and feature roles allow recursive topic folders. Feature pages remain at the feature root, named `*Page.tsx`; features need not have pages. Feature actions, validation, utils, types, config and stores choose one representation: `<role>.ts` or `<role>/`. Components and hooks stay in their named folders, optionally nested; providers, assets, styles, feature integrations in lib, and test support have explicit roles. Server/client TypeScript filename variants are supported for runtime-specific helpers.

Contracts keep root `api.ts`, with requests/responses/errors as a file or topic folder and optional endpoint files under `endpoints/`. Client actions use flat `modules/<module>.ts` or topic files under `modules/<module>/`; a flat module and its topic folder cannot coexist. Query modules keep `keys.ts` and `queries.ts`, with `queries/` available instead of the factory file. Domain vocabulary permits recursive topic grouping. Source classifiers apply semantic checks throughout these layouts and to unexpected filenames, so moving a file cannot bypass schema, query, date or action enforcement.

File/folder role collisions are checked against the current filesystem on every source lint invocation, including untracked source files. The rule does not cache directory inventories. Tests cover actual directory discovery and collisions. Non-source assets and empty directories are not parsed by Oxlint; their semantic ownership remains a review responsibility.

API modules retain inward layer dependencies while allowing recursive topics inside each layer. Domain events, application jobs/event handlers and registered postgres/http/redis/file infrastructure adapters have explicit suffix roles. PostgreSQL SQL syntax remains restricted to reader/repository adapters, migrations and seeds. Transport-specific adapters do not grant application/domain access to transport or persistence.

Extend the policy and its regression tests together when a new responsibility is needed, then update the relevant package README or architecture document. A new business topic inside an existing role needs no policy change. Do not create placeholder folders or disguise a new responsibility as a helper to satisfy lint. Generated exemptions name the actual route tree instead of accepting every `*.gen.ts` filename.
