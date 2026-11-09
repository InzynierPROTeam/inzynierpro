import {
  defaultShouldDehydrateQuery,
  environmentManager,
  type QueryClientConfig,
} from '@tanstack/react-query'

import { baseDefaultConfig, getSingletonQueryClientFactory } from './shared.js'

export const defaultConfig: QueryClientConfig = {
  ...baseDefaultConfig,
  defaultOptions: {
    ...baseDefaultConfig.defaultOptions,
    dehydrate: {
      shouldDehydrateQuery: query =>
        defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
    },
  },
}

export function getQueryClientFactory(config: QueryClientConfig = defaultConfig) {
  return getSingletonQueryClientFactory(config, { isServer: () => environmentManager.isServer() })
}
