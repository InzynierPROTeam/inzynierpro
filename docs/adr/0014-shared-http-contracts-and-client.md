# Shared HTTP contracts and client

Request, response and error contracts are defined once with Effect Schema HttpApi. Web, admin and mobile use one shared client built from these contracts. Contracts describe the backend interface; clients never import its internal models or SQL. Platform differences in transport and authentication stay in the matching adapters. One contract source limits drift between clients while staying independent of module implementations. Client actions, query keys and cache invalidation follow `packages/api-client/README.md` and `packages/queries/README.md`.

## Client compatibility

A regular backend deployment keeps supporting released client versions. API changes respect a compatibility period, especially for mobile. When an update is required, the client gets an unambiguous message; the backend sets the minimum version. The exact support period is set before the mobile client ships.

## Personal data and caching

A personal read, such as categories or documents combined with the user's progress, returns one response. The URL uses the shared QualificationPathId, but the result and cache are personal: the client cache key includes the account, the path and the request. The account ID is a cache dimension only, never an HTTP field or a source of backend authorization. The account cache is cleared on sign-out or authentication denial. TanStack Query is the cache; a Redis cache for learning data waits for measurements, and the backend checks authorization even for a future cache hit.

## Paginated collections

Every resource list uses the shared pagination schemas and a `data`/`meta` response. Clients page by cursor; administration by offset. Bounded configuration values are not collections. Selection of the current path is a separate query, independent of the loaded page of assignments.

## Dates

Every date in the system uses one codec and the ApiDateTime type: HTTP accepts and returns canonical UTC ISO 8601 with milliseconds, and decoding yields a validated Effect `DateTime.Utc`. There are no separate types per date role and no rule forcing midnight. The user may pick a local date and time; the client converts it to UTC and presents dates in its own time zone. A missing optional date is `Option` inside and `null` in JSON.
