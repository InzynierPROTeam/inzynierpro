# @inzpro/queries

Shared query keys and TanStack Query option factories.

**Runtime:** React Query consumers on web and native platforms.

Accept the configured HTTP client and preserve AbortSignal cancellation. Keep component rendering, application navigation, and environment loading in consumers. Contract and caching decisions are in [ADR-0014](../../docs/adr/0014-shared-http-contracts-and-client.md).

## Module layout

`src/modules/<module>.ts` starts with the module's key object, followed by its query option factories. `effectQueryOptions` keeps the result, the error union and the literal key tuple, and passes the `queryFn` `AbortSignal` to the runner. The application passes the HTTP client into the factory.

## Query keys

A key object is flat: `all`, named domain groups, and concrete operations. Each group extends `all` directly; each query extends its parent group. A group is named after a resource or responsibility, a query after the client operation.

- `all` identifies the whole module.
- `paths()` groups queries about the set of paths, for example `getPaths(req)`.
- `path(id)` groups queries about one path: its details, statistics, documents and preview.
- `session(userId, pathId, id)` groups the reads of one study session inside its path group, so starting or answering can refresh one session without touching others.
- The full request goes into the concrete query key, so every param, query, payload and header that affects the result is part of it. Query contracts use only explicit, serializable data; authentication stays in the HTTP adapter.

```ts
export const studyKeys = {
  all: ['study'] as const,
  path: (userId: UserId, id: QualificationPathId) =>
    [...studyKeys.all, 'path', userId, id] as const,
  getDocuments: (userId: UserId, req: GetDocumentsRequest) =>
    [...studyKeys.path(userId, req.params.qualificationPathId), 'getDocuments', req] as const,
}
```

Add groups only when used (health has `status()`, identity has `session()`), with no generic `general`, `items` or `item` levels in between. The key object stays a plain object of functions. The HTTP client, functions and secrets never go into a key.

## Factories

A factory takes `(httpClient, req)` and passes the same `req` to the key and the client action. Empty requests default to `req = {}`. Personal queries take `(httpClient, userId, req)`: `userId` comes from the authenticated application context and is a cache dimension, not an HTTP field. Every parent of personal data contains `userId`, as in `paths(userId)` and `path(userId, qualificationPathId)`. Onboarding options stay a shared catalog read.

List factories return `effectInfiniteQueryOptions`, pass the cursor in the same `req.query`, and read `nextCursor`/`hasMore` from `meta`. The typed `req` stays required for a request with a query, even when its pagination fields are optional.

## Invalidation

Invalidate through the parent key of the affected group:

```ts
await queryClient.invalidateQueries({ queryKey: studyKeys.all })
await queryClient.invalidateQueries({ queryKey: preparationKeys.paths(userId) })
await queryClient.invalidateQueries({ queryKey: studyKeys.path(userId, pathId) })
```

`path(userId, pathId)` covers every query of that path, without lists or other paths. A change affecting several groups invalidates each explicitly. `preparationKeys` groups onboarding, assignments and goals; `studyKeys` groups personal material reads. A write that changes an assignment's scope or state invalidates that path's group in both modules and the assignment list. Path selection is local to each client and has no query key or HTTP mutation. Platform components resolve the stored ID against the complete assignment list fetched with an ordinary query and the configured five-assignment limit. Assignment mutations invalidate `paths(userId)` and the affected path groups.

## Usage

```ts
import { checkHealthQueryOptions } from '@inzpro/queries/modules/health'
```

## Dependencies

Follow the workspace dependency directions in [policy.ts](../tools/src/oxlint/architecture-policy.ts). The [architecture guide](../../docs/architecture.md) explains package placement, test exceptions, wildcard exports, and verification.

## Ordinary and infinite query names

Factories using `effectInfiniteQueryOptions` end in `InfiniteQueryOptions`. `pathsQueryOptions` is the ordinary request; `pathsInfiniteQueryOptions` uses cursor pages. Their cache keys differ in shape and share the account's `paths(userId)` invalidation group. Never reuse a cache key between ordinary and infinite data. Define every concrete key in the module's `XKeys` object, including infinite variants directly below their ordinary operation. Factories and consumers call those functions instead of assembling or extending key arrays themselves.

Catalogue factories offer ordinary and infinite forms with separate cache keys. Prefetch the exact ordinary request consumed by the next step, including its limit. Identity also offers an optional-session factory with its own key: only an unauthenticated response becomes `null`; transport and server failures remain errors. Protected routes continue using the required-session factory.
