# @inzpro/queries

Shared query keys and TanStack Query option factories.

**Runtime:** React Query consumers on web and native platforms.

Accept the configured HTTP client, preserve AbortSignal cancellation, and follow ADR-0024 for hierarchical query keys. Keep component rendering, application navigation, and environment loading in consumers.

## Usage

```ts
import { checkHealthQueryOptions } from '@inzpro/queries/modules/health'
```

## Dependencies

Follow the workspace dependency directions in [policy.ts](../tools/src/oxlint/architecture-policy.ts). The [architecture guide](../../docs/architecture.md) explains package placement, test exceptions, wildcard exports, and verification.
