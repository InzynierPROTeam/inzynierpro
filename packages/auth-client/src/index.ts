import type { BetterAuthClientOptions } from 'better-auth'
import { createAuthClient } from 'better-auth/client'
import { emailOTPClient } from 'better-auth/client/plugins'

export const BASE_PLUGINS = [emailOTPClient()]

export const BASE_OPTIONS = {
  plugins: BASE_PLUGINS,
  basePath: '/api/v1/auth',
} satisfies BetterAuthClientOptions

type CallerOptions = Omit<BetterAuthClientOptions, 'plugins' | 'basePath'>

export type AuthClient = ReturnType<typeof createAuthClient<CallerOptions & typeof BASE_OPTIONS>>

export const getAuthClient = (options: CallerOptions): AuthClient =>
  createAuthClient({ ...options, ...BASE_OPTIONS })
