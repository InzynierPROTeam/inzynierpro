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

Public vocabulary is grouped by qualification-paths, exam-calendar, preparation and learning-content. The common date-time codec validates canonical UTC ISO strings and decodes them to Effect DateTime.Utc; all date fields use the same ApiDateTime runtime type. Encoded HTTP values remain strings. Catalogue options retain their concrete branded IDs; goal versions and question counts also have dedicated brands.

Collection contracts reuse common/pagination: cursor pages for clients and offset pages for administration, always with data/meta envelopes.
