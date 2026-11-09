import { getAuthClient } from '@inzpro/auth-client'
import { env } from '~platform/lib/env'

// Sign-in and sign-out only; the session is read through the shared contract.
// Failed calls reject, so mutations and toasts see them as errors.
export const authClient = getAuthClient({
  baseURL: env.VITE_API_URL.origin,
  fetchOptions: { throw: true },
})
