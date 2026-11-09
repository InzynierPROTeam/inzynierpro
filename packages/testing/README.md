# @inzpro/testing

Reusable adapters for behavior and integration tests.

**Runtime:** Node.js tests.

Own reusable test infrastructure such as a scoped HTTP test server. Keep product-specific fixtures next to the tests that own them. Import this package only from test/spec files, never production code.

## Usage

```ts
import { withHttpServer } from '@inzpro/testing/http'
```

## Dependencies

Follow the workspace dependency directions in [policy.ts](../tools/src/oxlint/architecture-policy.ts). The [architecture guide](../../docs/architecture.md) explains package placement, test exceptions, wildcard exports, and verification.
