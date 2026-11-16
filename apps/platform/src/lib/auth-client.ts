import { getAuthClient } from '@inzpro/auth-client'
import { env } from '~platform/lib/env'

export const authClient = getAuthClient({
  baseURL: env.VITE_API_URL.origin,
  fetchOptions: { throw: true },
})
