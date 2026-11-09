# @inzpro/redis

Redis connection infrastructure shared by backend packages and entrypoints.

**Runtime:** Server-side Node.js.

Provide the `Redis` service as a scoped layer: the connection opens when the layer is built and closes with its scope. Key layouts and caching rules remain with the code that owns the data. Client applications must not import this package.

## Usage

```ts
import { layer as RedisLayer, Redis } from '@inzpro/redis'
```

## Dependencies

Follow the workspace dependency directions in [policy.ts](../tools/src/oxlint/architecture-policy.ts). The [architecture guide](../../docs/architecture.md) explains package placement, test exceptions, wildcard exports, and verification.
