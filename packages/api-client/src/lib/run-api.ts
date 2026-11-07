import { Effect } from 'effect'
import { HttpClient } from 'effect/http'

export const runApi = <A, E>(
  action: Effect.Effect<A, E, HttpClient.HttpClient>,
  httpClient: HttpClient.HttpClient,
  signal?: AbortSignal,
): Promise<A> =>
  Effect.runPromise(Effect.provideService(action, HttpClient.HttpClient, httpClient), { signal })
