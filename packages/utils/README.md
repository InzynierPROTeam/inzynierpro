# @inzpro/utils

Environment-independent helpers and generic types.

**Runtime:** Universal JavaScript.

Own reusable string/type helpers, canonical URL handling and shared date operations. `date` uses Effect DateTime and Duration with Polish/Warsaw defaults from `config/localization`; the same helpers work on web and mobile without browser APIs. `exam-access` shares labels and client predicates based on the domain literals; `domain` does not depend on utils. Keep React, persistence and authoritative backend authorization outside this package.

Date form helpers convert Warsaw wall time to UTC ISO and back, with empty input represented by `null`. Validate input with `isDateTimeInput` before submitting. Spring DST gaps are invalid; autumn overlaps choose the earlier occurrence. Calendar-day helpers use Warsaw boundaries; elapsed intervals use Duration. Native Date is permitted only for widget/driver interop.

## Usage

```ts
import { getCanonicalHref } from '@inzpro/utils/seo'
```

## Dependencies

The permitted workspace directions are defined in [policy.ts](../tools/src/oxlint/architecture-policy.ts). Follow the [architecture guide](../../docs/architecture.md) for imports, wildcard exports, test exceptions and verification.
