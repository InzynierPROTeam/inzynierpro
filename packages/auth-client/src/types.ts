import type { getAuthClient } from '~auth-client/index.js'

export type AuthClientOptions = Parameters<typeof getAuthClient>[0]

export type CustomFetchImpl = NonNullable<
  NonNullable<AuthClientOptions['fetchOptions']>['customFetchImpl']
>
