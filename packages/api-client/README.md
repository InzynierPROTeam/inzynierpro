# @inzpro/api-client

Reusable Effect actions and HTTP transport composition.

**Runtime:** Universal JavaScript with an HTTP client supplied by the consumer.

Keep actions as Effects until the Promise execution adapter runs them. Applications own environment values, credential adapters, and navigation after authentication failures. React and TanStack Query belong in their own packages.

## Usage

```ts
import { runApi } from '@inzpro/api-client/lib/run-api'
import { checkHealth } from '@inzpro/api-client/modules/health/actions'
```

## Dependencies

Follow the workspace dependency directions in [policy.ts](../tools/src/oxlint/architecture-policy.ts). The [architecture guide](../../docs/architecture.md) explains package placement, test exceptions, wildcard exports, and verification.
