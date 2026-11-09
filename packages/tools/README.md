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
