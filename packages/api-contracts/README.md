# @inzpro/api-contracts

Public HTTP contracts for all clients.

**Runtime:** Universal JavaScript, including Node, Workers, browsers, and native clients.

Own endpoint schemas, JSON-compatible request/response data, and declared transport errors. Keep SQL, internal backend models, and UI outside this package.

## Usage

```ts
import { HealthCheckResponse } from '@inzpro/api-contracts/modules/health/responses'
```

## Dependencies

Follow the workspace dependency directions in [policy.ts](../tools/src/oxlint/architecture-policy.ts). The [architecture guide](../../docs/architecture.md) explains package placement, test exceptions, wildcard exports, and verification.
