# @inzpro/domain

Small shared schemas for public business vocabulary.

**Runtime:** Universal JavaScript.

The initial identifier schema validates UUIDs while retaining plain string values. Add public branded identifiers and genuinely shared pure rules as consumers need them. Private entities, use cases, SQL and authoritative business decisions stay inside apps/api modules.

## Usage

```ts
import { Uuid } from '@inzpro/domain/common/id'
```

## Dependencies

Domain depends on no other workspace package. `utils` may consume its vocabulary for shared client labels and predicates; domain must not import utils.

The permitted workspace directions are defined in [policy.ts](../tools/src/oxlint/architecture-policy.ts). Follow the [architecture guide](../../docs/architecture.md) for imports, wildcard exports, test exceptions and verification.

Public vocabulary is grouped by qualification-paths, exam-calendar, preparation and learning-content. The common date-time module separates `UtcIsoDateTime` (a canonical UTC ISO string for public DTOs) from `DateTimeUtc` (an Effect UTC codec for private backend models and SQL boundaries). Public schemas retain ISO/null without runtime transformations. Backend module presentation functions map rich dates and Option back to DTOs. Catalogue options retain their concrete branded IDs; goal versions and question counts also have dedicated brands.

Collection contracts reuse common/pagination: cursor pages for clients and offset pages for administration, always with data/meta envelopes.

Catalogue codes are closed literal schemas built from named constants and readonly arrays. Adding a specialization, kind or scope requires updating those constants and the exhaustive client icon mappings. Specializations also expose a nullable description for railway variants. Exam-session options contain an ISO written date and an explicit confirmation flag; goals retain that flag for consistent estimated-date presentation.
