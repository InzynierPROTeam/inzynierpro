# @inzpro/browser-utils

Small adapters for browser APIs.

**Runtime:** Browsers; imports are safe on the server.

Access cookies and storage only when functions run. Storage access can fail when unavailable; callers decide how to recover. Keep React subscriptions and product configuration outside this package.

## Usage

```ts
import { getCookie } from '@inzpro/browser-utils/cookie'
```

## Dependencies

The permitted workspace directions are defined in [policy.ts](../tools/src/oxlint/architecture-policy.ts). Follow the [architecture guide](../../docs/architecture.md) for imports, wildcard exports, test exceptions and verification.
