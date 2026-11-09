# @inzpro/react-utils

Shared React integrations and client lifecycle helpers.

**Runtime:** React on web, with environment-independent query helpers reusable by native clients.

Own QueryClient factories and browser theme subscriptions. Server query caches are isolated per request. Browser theme helpers are imported through their own subpaths, so native consumers can use the query helpers independently. Keep HTTP transport in api-client.

## Usage

```ts
import { getQueryClientFactory } from '@inzpro/react-utils/react-query/web'
```

## Dependencies

The permitted workspace directions are defined in [policy.ts](../tools/src/oxlint/architecture-policy.ts). Follow the [architecture guide](../../docs/architecture.md) for imports, wildcard exports, test exceptions and verification.
