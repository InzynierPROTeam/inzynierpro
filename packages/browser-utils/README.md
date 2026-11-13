# @inzpro/browser-utils

Small adapters for browser APIs.

**Runtime:** Browsers; imports are safe on the server.

Access cookies and storage only when functions run. Storage access can fail when unavailable; callers decide how to recover. Keep React subscriptions and product configuration outside this package.

## Cookies

`cookie.ts` owns the shared client-readable cookie policy: `Secure`, `SameSite=Strict`, `Path=/`, and no `Domain`. Browser operations and SSR adapters use `getCookieOptions`; callers may configure only `maxAge` as an Effect `Duration`, defaulting to `Duration.days(7)`. Conversion to seconds happens at the cookie boundary. Feature-specific names and lifetimes remain with their consumers. Browser writes serialize `Max-Age`; removals use `Cookies.remove` with the same security and host-only scope. Existing cookie names are preserved.

These cookies are intentionally readable by JavaScript. Authentication cookies, including their `HttpOnly` policy, remain owned by the authentication service. Imports are server-safe; browser operations access `document` only when called.

## Usage

```ts
import { getCookie } from '@inzpro/browser-utils/cookie'
```

## Dependencies

The permitted workspace directions are defined in [policy.ts](../tools/src/oxlint/architecture-policy.ts). Follow the [architecture guide](../../docs/architecture.md) for imports, wildcard exports, test exceptions and verification.
