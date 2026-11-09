# @inzpro/db

PostgreSQL connection infrastructure shared by backend entrypoints.

**Runtime:** Server-side PostgreSQL consumers.

Provide connection layers. Business SQL, data ownership, transactions, and migrations remain inside the owning modules of apps/api. Client applications must not import this package.

## Usage

```ts
import { databaseLayer } from '@inzpro/db'
import { pgPoolLayer } from '@inzpro/db/pool'
```

## Dependencies

Follow the workspace dependency directions in [policy.ts](../tools/src/oxlint/architecture-policy.ts). The [architecture guide](../../docs/architecture.md) explains package placement, test exceptions, wildcard exports, and verification.
