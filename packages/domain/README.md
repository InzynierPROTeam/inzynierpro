# @inzpro/domain

Shared business vocabulary: single values and pure rules that clients and the backend both need.

**Runtime:** Universal JavaScript.

Holds branded identifiers, literal codes, value primitives and genuinely shared pure rules such as limits and version steps. It holds no object schemas: shapes that cross HTTP belong in `@inzpro/api-contracts`, and backend models, use cases, SQL and authoritative business decisions stay inside `apps/api` modules. [ADR-0027](../../docs/adr/0027-schema-ownership-and-module-layers.md) records the split, and the `conventions/domain-vocabulary` lint rule rejects `Schema.Struct`, `Schema.Class` and similar here.

## Usage

```ts
import { Uuid } from '@inzpro/domain/common/id'
```

## Dependencies

Domain depends on no other workspace package. `utils` may consume its vocabulary for shared client labels and predicates; domain must not import utils.

The permitted workspace directions are defined in [policy.ts](../tools/src/oxlint/architecture-policy.ts). Follow the [architecture guide](../../docs/architecture.md) for imports, wildcard exports, test exceptions and verification.

Public vocabulary is grouped by qualification-paths, exam-calendar, preparation and learning-content. The common date-time module separates `UtcIsoDateTime` (a canonical UTC ISO string for public DTOs) from `DateTimeUtc` (an Effect UTC codec for private backend models and SQL boundaries). Public schemas retain ISO/null without runtime transformations; each API module's `http/mappers.ts` maps rich dates and Option to DTOs. Catalogue IDs are concretely branded; goal versions and question counts also have dedicated brands.

`common/pagination` holds the page vocabulary: `PageLimit`, `PageNumber`, the opaque `Cursor` and the default and maximum limits. Pagination parameters and `data`/`meta` envelopes are contracts in `@inzpro/api-contracts/utils/pagination`; cursor encoding and keyset paging are backend mechanics in `apps/api/src/lib/cursor-pagination.ts`.

Catalogue codes are closed literal schemas built from named constants and readonly arrays. Adding a specialization, kind or scope requires updating those constants and the exhaustive client icon mappings.
