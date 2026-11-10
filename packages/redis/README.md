# @inzpro/redis

Redis connection infrastructure shared by backend packages and entrypoints.

**Runtime:** Server-side Node.js.

Provide the `Redis` service as a scoped layer: the connection opens when the layer is built and closes with its scope. Key layouts and caching rules remain with the code that owns the data. Client applications must not import this package.

`@inzpro/redis/rate-limiter` provides the `RateLimiter` service: an atomic token bucket in a Lua script. Callers own the key layout, limits and what to do when Redis is unavailable.

## Usage

```ts
import { layer as RedisLayer, Redis } from '@inzpro/redis'
import { layer as RateLimiterLayer, RateLimiter } from '@inzpro/redis/rate-limiter'
```

## Dependencies

Follow the workspace dependency directions in [policy.ts](../tools/src/oxlint/architecture-policy.ts). The [architecture guide](../../docs/architecture.md) explains package placement, test exceptions, wildcard exports, and verification.
