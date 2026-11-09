# @inzpro/auth

Better Auth configuration shared by backend entrypoints.

**Runtime:** Server-side Node.js.

Build the Better Auth instance as the `Auth` service from a PostgreSQL pool, Redis and `EmailService` from `@inzpro/email` (tests provide an in-memory adapter). Session storage, sign-in codes, rate limiting and cookies are configured here. A sign-in code that cannot be sent is answered with `503 SIGN_IN_CODE_NOT_SENT`. Endpoint mounting and environment loading remain in the application. Client applications must not import this package; they use `@inzpro/auth-client`.

An optional Google configuration enables the built-in provider with `prompt: 'select_account'`, matching V1. Account linking explicitly requires verified provider and local emails, with no trusted providers or different-email linking. Existing provider account IDs retain their owner. Origin checking stays enabled in tests as well as production. See the root [Google setup and smoke procedure](../../README.md#google-sign-in) for callback/origin configuration.

## Usage

```ts
import { Auth, layer as AuthLayer } from '@inzpro/auth'
```

## Dependencies

Follow the workspace dependency directions in [policy.ts](../tools/src/oxlint/architecture-policy.ts). The [architecture guide](../../docs/architecture.md) explains package placement, test exceptions, wildcard exports, and verification.
