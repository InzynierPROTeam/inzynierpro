# @inzpro/queries

Shared query keys and TanStack Query option factories.

**Runtime:** React Query consumers on web and native platforms.

Accept the configured HTTP client and preserve AbortSignal cancellation. Keep component rendering, application navigation, and environment loading in consumers. Contract and caching decisions are in [ADR-0014](../../docs/adr/0014-shared-http-contracts-and-client.md).

## Module layout

`src/modules/<module>/keys.ts` owns the module's key object; `queries.ts` owns its query option factories and imports that object. A larger set of factories may replace `queries.ts` with `queries/<topic>.ts`, with further topical nesting when needed. Use the file or the directory for that role, never both. Adjacent tests exercise cache behavior and HTTP execution. `effectQueryOptions` keeps the result, the error union and the literal key tuple, and passes the `queryFn` `AbortSignal` to the runner. The application passes the HTTP client into the factory.

## Query keys

Declare grouping keys first, ordered from the root to their descendants, then the concrete operation keys. A key object is flat: `all`, named domain groups, and concrete operations. Each group extends `all` directly; each query extends its parent group. A group is named after a resource or responsibility, a query after the client operation.

- `all` identifies the whole module.
- `paths()` groups queries about the set of paths, for example `getPaths(req)`.
- `path(id)` groups queries about one path: its details, statistics, documents and preview.
- `session(userId, pathId, id)` groups the reads of one study session inside its path group (the session, its summary and results), so starting or answering can refresh one session without touching others. Its questions sit in `questions(userId)` instead.
- `progress(userId, pathId)` groups the path's reads that show the learner's progress (documents, preview, latest session, daily plan, review preview and the unfinished review and favourites sessions), so an answer refreshes them without refetching the session reads it already updated.
  The following oral groups belong to `oralStudyKeys`; their root is `['oral-study']`. The written root is `['written-study']`, so a mutation affecting both kinds invalidates both explicitly.

- `oralProgress(userId, pathId)` groups the path's oral reads that show the learner's oral progress (oral categories, oral preview, latest oral session and its next step, and the oral daily plan), so a self-assessment refreshes them.
- `oralSession(userId, pathId, id)` groups the reads of one oral session: the session, summary, results, its mini-quiz and the quiz's paginated checks. Questions belong to `oralQuestions(userId)` because oral marks and notes are shared across paths.
- `oralFavorites(userId)` groups oral favourites previews across paths. Marks stale this group and `oralQuestions(userId)` without refetching active session reads. Notes stale only `oralQuestions(userId)`. The unfinished favourites session belongs to `oralProgress(userId, pathId)`; starting or ending a session refreshes it.
- `mockExamKeys.path(userId, pathId)` groups a path's preview, history and draft attempts; `attempt(userId, pathId, id)` groups the attempt and its individual questions. Starting, pausing, resuming and finishing set the returned attempt directly and mark the path stale without refetching active views. Draft answer and flag mutations update the affected question and its navigation state inline, cache the returned question, then refetch only that question and attempt to reconcile success, failure or conflict; a write refused because the attempt is paused refetches only the attempt, since a paused question read is refused. `reviewQuestions(userId)` groups cursor-paginated reviews across paths because notes and favourites are shared; `review(userId, pathId, id)` narrows that group to one attempt. Note and favourite writes patch matching review questions directly and stale the corresponding written-study question/favourite groups without refetching the attempt or review pages.
- `streakKeys.account(userId)` groups the account streak shown in the app shell. Written and oral answers, mini-quiz checks and a mock exam that ends refresh it, because every counted answer may change today's count.
- `account(userId)` groups everything the account reads about its own study: every path group, the favourites group and the questions group.
- `favorites(userId)` groups the favourites previews of every path. A mark is shared across paths and nothing else in a path changes them, so marking or unmarking marks this group stale (`refetchType: 'none'`) without refetching the session or progress.
- `questions(userId)` groups every session question on any path. A question shows the learner's FavoriteQuestion mark and PersonalQuestionNote, both shared across paths, so marking, unmarking, saving or clearing a note marks this group stale (`refetchType: 'none'`); a note leaves the favourites previews alone.
- The full request goes into the concrete query key, so every param, query, payload and header that affects the result is part of it. Query contracts use only explicit, serializable data; authentication stays in the HTTP adapter.

```ts
export const writtenStudyKeys = {
  all: ['written-study'] as const,
  account: (userId: UserId) => [...writtenStudyKeys.all, 'account', userId] as const,
  path: (userId: UserId, id: QualificationPathId) =>
    [...writtenStudyKeys.account(userId), 'path', id] as const,
  getDocuments: (userId: UserId, req: GetDocumentsRequest) =>
    [
      ...writtenStudyKeys.path(userId, req.params.qualificationPathId),
      'getDocuments',
      req,
    ] as const,
}
```

Add groups only when used (health has `status()`, identity has `session()`), with no generic `general`, `items` or `item` levels in between. The key object stays a plain object of functions. The HTTP client, functions and secrets never go into a key.

## Factories

A factory takes `(httpClient, req)` and passes the same `req` to the key and the client action. Empty requests default to `req = {}`. Personal queries take `(httpClient, userId, req)`: `userId` comes from the authenticated application context and is a cache dimension, not an HTTP field. Every parent of personal data contains `userId`, as in `paths(userId)` and `path(userId, qualificationPathId)`. Onboarding options stay a shared catalog read.

List factories return `effectInfiniteQueryOptions`, pass the cursor in the same `req.query`, and read `nextCursor`/`hasMore` from `meta`. The typed `req` stays required for a request with a query, even when its pagination fields are optional.

## Invalidation

Invalidate through the parent key of the affected group:

```ts
await queryClient.invalidateQueries({ queryKey: writtenStudyKeys.all })
await queryClient.invalidateQueries({ queryKey: preparationKeys.paths(userId) })
await queryClient.invalidateQueries({ queryKey: writtenStudyKeys.path(userId, pathId) })
```

`path(userId, pathId)` covers every query of that path, without lists or other paths. A change affecting several groups invalidates each explicitly. `preparationKeys` groups onboarding, assignments and goals; `writtenStudyKeys` and `oralStudyKeys` group the two kinds of personal material reads. A write that changes an assignment's scope or state invalidates that path's group in preparation, written study and oral study, plus the assignment list. Path selection is local to each client and has no query key or HTTP mutation. Platform components resolve the stored ID against the complete assignment list fetched with an ordinary query and the configured five-assignment limit. Assignment mutations invalidate `paths(userId)` and the affected path groups.

## Usage

```ts
import { checkHealthQueryOptions } from '@inzpro/queries/modules/health/queries'
```

## Dependencies

Follow the workspace dependency directions in [policy.ts](../tools/src/oxlint/architecture-policy.ts). The [architecture guide](../../docs/architecture.md) explains package placement, test exceptions, wildcard exports, and verification.

## Ordinary and infinite query names

Factories using `effectInfiniteQueryOptions` end in `InfiniteQueryOptions`. `pathsQueryOptions` is the ordinary request; `pathsInfiniteQueryOptions` uses cursor pages. Their cache keys differ in shape and share the account's `paths(userId)` invalidation group. Never reuse a cache key between ordinary and infinite data. Define every concrete key in the module's `XKeys` object, including infinite variants directly below their ordinary operation. Factories and consumers call those functions instead of assembling or extending key arrays themselves.

Catalogue factories offer ordinary and infinite forms with separate cache keys. Prefetch the exact ordinary request consumed by the next step, including its limit. Identity also offers an optional-session factory with its own key: only an unauthenticated response becomes `null`; transport and server failures remain errors. Protected routes continue using the required-session factory.
