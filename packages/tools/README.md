# @inzpro/tools

Repository development checks and their regression tests.

**Runtime:** Node.js development tooling and CI.

Own lint infrastructure and architecture checks. Use existing tool capabilities first, and add custom checks only for concrete gaps. This package is not application runtime code.

## Usage

From the repository root:

```sh
pnpm lint
```

## Dependencies

Follow the workspace dependency directions in [policy.ts](../tools/src/oxlint/architecture-policy.ts). The [architecture guide](../../docs/architecture.md) explains package placement, test exceptions, wildcard exports, and verification.

## Convention checks

The Oxlint conventions plugin checks infinite-query factory names, named component props, page composition from feature sections, gap-based spacing and read-only query dependencies. The rules and their adjacent regression tests define the exact accepted syntax. They run through the existing lint, pre-commit and CI commands.

Date enforcement uses `conventions/date-boundaries` for public ISO/null DTOs, shared client date helpers, private backend models and the absence of custom client serialization adapters. `conventions/prefer-duration` rejects common manual unit-conversion chains and raw numeric cache/timeout lifetimes. Tests are exempt from these two rules so they can exercise invalid representations and clock boundaries. The existing Effect DateTime rule still applies. Syntax checks complement response types and timezone/contract tests; they do not prove arbitrary nested JSON compatibility.

`conventions/prefer-cx` rejects ternaries directly inside JSX `className`, including ternaries nested in class-composition calls and template strings. Use `cx` with object conditions. Function-valued component props may still adapt a className callback without this rule inspecting its implementation.
