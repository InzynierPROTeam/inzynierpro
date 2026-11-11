# @inzpro/api-contracts

Public HTTP contracts for all clients.

**Runtime:** Universal JavaScript, including Node, Workers, browsers, and native clients.

Own endpoint schemas, JSON-compatible request/response data, and declared transport errors. Keep SQL, internal backend models, and UI outside this package.

Request-part schemas (params, query, payload, headers) live in `src/modules/<module>/requests.ts`, beside `responses.ts`. Endpoints import them and are exported individually so clients can infer their requests. A request schema is a direct alias of an existing schema when it adds no fields. Decisions behind the contracts are in [ADR-0014](../../docs/adr/0014-shared-http-contracts-and-client.md).

## Usage

```ts
import { HealthCheckResponse } from '@inzpro/api-contracts/modules/health/responses'
```

## Dependencies

Follow the workspace dependency directions in [policy.ts](../tools/src/oxlint/architecture-policy.ts). The [architecture guide](../../docs/architecture.md) explains package placement, test exceptions, wildcard exports, and verification.
