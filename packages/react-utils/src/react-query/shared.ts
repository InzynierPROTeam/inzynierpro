import { QueryClient, type QueryClientConfig } from '@tanstack/react-query'
import { Duration } from 'effect'

const FIVE_MINUTES = Duration.toMillis(Duration.minutes(5))
export const QUERY_STALE_TIME = FIVE_MINUTES
export const QUERY_CACHE_TIME = QUERY_STALE_TIME + FIVE_MINUTES

export const baseDefaultConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: QUERY_STALE_TIME,
      gcTime: QUERY_CACHE_TIME,
      retry: false,
    },
    mutations: {
      gcTime: QUERY_CACHE_TIME,
    },
  },
}

export function makeQueryClient(config: QueryClientConfig = baseDefaultConfig) {
  return new QueryClient(config)
}

type SingletonQueryClientFactoryOptions = {
  isServer: () => boolean
}

export function getSingletonQueryClientFactory(
  config?: QueryClientConfig,
  options: SingletonQueryClientFactoryOptions = { isServer: () => false },
) {
  let client: QueryClient | undefined

  return function () {
    if (options.isServer()) {
      return makeQueryClient(config)
    }

    if (!client) {
      client = makeQueryClient(config)
    }

    return client
  }
}
