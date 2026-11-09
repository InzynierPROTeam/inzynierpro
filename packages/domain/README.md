# @inzpro/domain

Small shared schemas for public business vocabulary.

**Runtime:** Universal JavaScript.

The initial identifier schema validates UUIDs while retaining plain string values. Add public branded identifiers and genuinely shared pure rules as consumers need them. Private entities, use cases, SQL and authoritative business decisions stay inside apps/api modules.

## Usage

```ts
import { Uuid } from '@inzpro/domain/common/id'
```

## Dependencies

The permitted workspace directions are defined in [policy.ts](../tools/src/oxlint/architecture-policy.ts). Follow the [architecture guide](../../docs/architecture.md) for imports, wildcard exports, test exceptions and verification.
