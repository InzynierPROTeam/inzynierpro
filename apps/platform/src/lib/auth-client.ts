import { getAuthClient } from '@inzpro/auth-client'
import { env } from '~platform/lib/env'

// Failed calls reject, so mutations and toasts see them as errors.
export const authClient = getAuthClient({
  baseURL: env.VITE_API_URL.origin,
  fetchOptions: { throw: true },
})
