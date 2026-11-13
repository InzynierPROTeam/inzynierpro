import { runApi } from '@inzpro/api-client/lib/run-api'
import type { CursorPage } from '@inzpro/api-contracts/utils/pagination'
import type { Cursor } from '@inzpro/domain/common/pagination'
import {
  infiniteQueryOptions,
  queryOptions,
  type QueryKey,
  type InfiniteData,
} from '@tanstack/react-query'
import type { Effect } from 'effect'
import type { HttpClient } from 'effect/http'

export const effectQueryOptions = <A, E, const Key extends QueryKey>(
  queryKey: Key,
  action: Effect.Effect<A, E, HttpClient.HttpClient>,
  httpClient: HttpClient.HttpClient,
) =>
  queryOptions<A, E, A, Key>({
    queryKey,
    queryFn: ({ signal }) => runApi(action, httpClient, signal),
  })

export const effectInfiniteQueryOptions = <A, E, const Key extends QueryKey>(
  queryKey: Key,
  action: (cursor: Cursor | undefined) => Effect.Effect<CursorPage<A>, E, HttpClient.HttpClient>,
  httpClient: HttpClient.HttpClient,
  initialCursor: Cursor | undefined,
) =>
  infiniteQueryOptions<CursorPage<A>, E, InfiniteData<CursorPage<A>>, Key, Cursor | undefined>({
    queryKey,
    initialPageParam: initialCursor,
    queryFn: ({ pageParam, signal }) => runApi(action(pageParam), httpClient, signal),
    getNextPageParam: lastPage => (lastPage.meta.hasMore ? lastPage.meta.nextCursor : undefined),
  })
