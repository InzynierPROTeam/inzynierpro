# Linting and Effect tooling

## Commands

- `pnpm lint` runs type-aware Oxlint through `effect-tsgo` with the recommended Effect diagnostics.
- `pnpm lint:fix` explicitly applies available fixes. `pnpm format` formats files; `pnpm format:check` only verifies formatting.
- `pnpm type-check` checks workspace packages using the Effect-integrated TypeScript compiler.
- `pnpm test` runs workspace test scripts. The tools package uses `tsx --test`, which discovers colocated test files automatically, including the bundled rule tests.
- `pnpm check` verifies formatting, lint, types, tests, and available builds without fixing source files.

The Husky `pre-commit` hook runs `pnpm lint:fix` followed by `pnpm format` across the repository. It does not run tests, a separate type-check, or builds. Lint errors block the commit. Automatic fixes remain in the working tree; review and stage them before committing. The hook does not stage changes automatically.

Shared development dependencies live in the root package; workspace scripts use that toolchain. Do not repeat shared devDependencies in each private app/package. The explicit exception is `effect` in `packages/tools/devDependencies`, where it supports lint integration tests. Runtime dependencies remain explicit in the workspace that uses them.

Versions are pinned in the pnpm catalog. Upgrade Oxlint and `@oxlint/plugins` together. Select TypeScript, Oxlint, and oxlint-tsgolint versions supported by the chosen `@effect/tsgo` release. All packages, including native binaries, must satisfy `minimumReleaseAge`; do not add exclusions to bypass it.

Root lint configurations are global Turbo cache dependencies, so changes invalidate typechecking and CLI integration tests. Each workspace's TypeScript configuration belongs to its own cache inputs.

## Rule layers

1. **Project rules:** `packages/tools/src/oxlint/project-layout.ts` enforces blank lines before returns, spacing around control flow, imports first, and spacing after imports. Tests cover valid/invalid cases, comments, directives, and autofixes. Newline fixes preserve indentation and handle adjacent comments.
2. **Anti-slop:** bundled in `packages/tools/src/oxlint/anti-slop/`. All generic rules, the separate Effect rule group, and the complementary native `oxc/no-accumulating-spread` rule are enabled.
3. **Effect:** the recommended `@effect/tsgo` preset supplies type-aware diagnostics, including floating Effects and missing requirements/errors. Error diagnostics fail lint; suggestions retain the preset's severity.

The bundled Anti-slop rules include tests, MIT licenses, and a `UPSTREAM.json` provenance manifest. The manifest records source hashes and local patches with reasons and hashes. One compatibility patch handles an indexed array read under `noUncheckedIndexedAccess` without changing rule behavior. Bundled rule code is excluded from project linting/formatting but remains covered by tests and typechecking. Keep the manifest accurate when updating these files, and place project-specific extensions outside that directory.

Agent assets are excluded from linting; lint checks target product code and project tooling.

## TypeScript configuration

Each app/package has one `tsconfig.json`, with no repository-level base config or separate test/build configs. Extend the appropriate `@total-typescript/tsconfig` preset directly and define platform options, source directories, and aliases locally. The tools package uses `tsc/no-dom/library-monorepo` and ES2024.

Keep `*.test.ts`/`*.test.tsx` beside the corresponding source files under `src`, in the same TypeScript project. Put `@effect/language-service` options directly in each workspace configuration.

## Installation and editors

`pnpm install` runs `effect-tsgo patch --oxlint` to install compatible TypeScript/Oxlint components inside node_modules. This also runs in CI; skipping Git hooks does not skip the Effect setup. Lint/typecheck scripts additionally invoke the explicit `effect-tsgo` wrapper.

VS Code/Cursor workspace settings select the native workspace TypeScript through `.vscode/settings.json`. The language service provides quick info, completions, and refactors. `diagnostics: false` avoids duplicating diagnostics reported by Oxlint.

Install the recommended `oxc.oxc-vscode` extension for editor lint diagnostics. It uses the local tool and the preset's type-aware setting. Fix-on-save is not enabled automatically.

The separate `effectful-tech.effect-vscode` debugger extension is also recommended. It supports context/fiber inspection, span stacks, and pause-on-defect, alongside the project language service. Runtime debugger validation requires an actual application process and has not yet been performed in this repository.

Editor settings may require a window reload. CLI tests verify the toolchain, not activation in a particular editor installation. On Linux, these native Effect/Oxlint builds require glibc rather than Alpine/musl.
