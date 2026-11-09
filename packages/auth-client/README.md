# @inzpro/auth-client

Better Auth client shared by client applications.

**Runtime:** Universal JavaScript with `fetch`.

Provide the shared Better Auth endpoints and plugins through `getAuthClient`, plus Polish messages for authentication errors. Applications supply the API URL and fetch options. The signed-in session is read through `@inzpro/api-client` and the shared contract, not through this client.

## Usage

```ts
import { getAuthClient } from '@inzpro/auth-client'
import { getAuthErrorMessage } from '@inzpro/auth-client/error'
```

## Dependencies

Follow the workspace dependency directions in [policy.ts](../tools/src/oxlint/architecture-policy.ts). The [architecture guide](../../docs/architecture.md) explains package placement, test exceptions, wildcard exports, and verification.
