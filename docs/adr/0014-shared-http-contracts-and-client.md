# Shared HTTP contracts and client

Request, response and error contracts are defined once with Effect Schema HttpApi. Web, admin and mobile use one shared client built from these contracts. Contracts describe the backend interface; clients never import its internal models or SQL. Platform differences in transport and authentication stay in the matching adapters. One contract source limits drift between clients while staying independent of module implementations. Client actions, query keys and cache invalidation follow `packages/api-client/README.md` and `packages/queries/README.md`.

## Client compatibility

A regular backend deployment keeps supporting released client versions. API changes respect a compatibility period, especially for mobile. When an update is required, the client gets an unambiguous message; the backend sets the minimum version. The exact support period is set before the mobile client ships.

## Personal data and caching

A personal read, such as categories or documents combined with the user's progress, returns one response. The URL uses the shared QualificationPathId, but the result and cache are personal: the client cache key includes the account, the path and the request. The account ID is a cache dimension only, never an HTTP field or a source of backend authorization. The account cache is cleared on sign-out or authentication denial. TanStack Query is the cache; a Redis cache for learning data waits for measurements, and the backend checks authorization even for a future cache hit.

## Paginated collections

Every resource list uses the shared pagination schemas from `@inzpro/api-contracts/utils/pagination` and a `data`/`meta` response. Clients page by cursor; administration by offset. Bounded configuration values are not collections. Selection of the current path is a separate query, independent of the loaded page of assignments.

Cursor pages use keyset pagination. A cursor is an opaque base64url token of the sort-key fields; clients pass it back unchanged and never build or parse it. API readers declare their sort columns once through `makeCursorPaginator` (`apps/api/src/lib/cursor-pagination.ts`), which derives ORDER BY, the predicate after the cursor and the next cursor from that declaration. Sort columns are NOT NULL and end with a unique column.

## Dates

The database stores instants as `timestamptz(3)`. PostgreSQL preserves the instant, not the original input offset or IANA zone. No zone column is needed while the product interprets exam dates and business days in Europe/Warsaw. A future requirement to retain the user's original zone needs an explicit separate field.

Public schemas use `UtcIsoDateTime`, a branded canonical UTC ISO 8601 string with milliseconds, and `null` for an absent value. HTTP decoding preserves these primitives. API clients, query caches and router contexts contain JSON-compatible values, with no custom serialization adapters.

Backend module models use `DateTimeUtc` (Effect `DateTime.Utc`) and `Option` for optional dates. Commands, readers and repositories operate on these models. SQL adapters decode native driver dates into Effect values and encode timestamps for SQL parameters. A module's `http/mappers.ts` converts validated ISO/null input into models and maps models back to ISO/null. Public DTOs and private models are distinct schemas, declared independently (ADR-0027); the handler's response type prevents returning a rich model accidentally.

Shared helpers live in `packages/utils/date`, use Effect DateTime/Clock/Duration and take Polish localization defaults from `config`. Forms interpret local date/time input in Europe/Warsaw regardless of the device zone. Nonexistent spring DST times are invalid; repeated autumn times use the earlier occurrence. Display and calendar-day boundaries also use Warsaw, including 23-hour and 25-hour days. Elapsed learning intervals remain durations rather than calendar-day calculations. Empty form values become `null`. Native Date exists only for SQL or widget interop, never in API data or cached state.

The conventions lint rules enforce JSON schema boundaries, client date-helper imports, private backend model imports and Duration-based intervals. Existing native-date lint checks remain enabled. Type checking and tests cover the representations, presentation mapping, timezone-independent form round trips and DST day boundaries. These checks complement one another; syntax linting alone cannot prove that every nested response value is JSON-compatible.
