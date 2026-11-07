import { runApi } from '@inzpro/api-client/lib/run-api'
import { queryOptions, type QueryKey } from '@tanstack/react-query'
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
