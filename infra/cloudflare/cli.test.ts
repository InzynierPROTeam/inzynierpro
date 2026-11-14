import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('../../', import.meta.url))

const validEnv = {
  ...process.env,
  CLOUDFLARE_ACCOUNT_ID: '0123456789abcdef0123456789abcdef',
  VITE_APP_BASE_URL: 'https://platform.staging.example.com',
  VITE_API_URL: 'https://api.staging.example.com',
  VITE_MAIN_PAGE_BASE_URL: 'https://www.example.com',
  COOKIES_DOMAIN: 'staging.example.com',
}

const run = (args: string[], overrides: NodeJS.ProcessEnv = {}) =>
  spawnSync(process.execPath, ['--import', 'tsx', 'infra/cloudflare/cli.ts', ...args], {
    cwd: root,
    env: { ...validEnv, ...overrides },
    encoding: 'utf8',
  })

describe('Cloudflare deployment command', () => {
  it.each(
    [[], ['deploy'], ['deploy', 'development'], ['deploy', 'prod', 'extra']].map(args => ({
      args,
    })),
  )('rejects missing or unsupported arguments before starting deployment: %j', ({ args }) => {
    const result = run(args)
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('Usage:')
  })

  it.each([
    { VITE_API_URL: 'http://api.staging.example.com' },
    { VITE_API_URL: 'https://api.production.example.com' },
    { VITE_APP_BASE_URL: 'https://platform.staging.example.com/path' },
    { VITE_MAIN_PAGE_BASE_URL: 'invalid' },
    { COOKIES_DOMAIN: 'com' },
    { COOKIES_DOMAIN: '' },
    { CLOUDFLARE_ACCOUNT_ID: '' },
  ])('rejects invalid origins and configuration before starting Alchemy: %j', overrides => {
    const result = run(['deploy', 'staging'], overrides)
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('Invalid deployment configuration')
  })

  it.each(['staging', 'prod'])('validates %s without credentials or provisioning', stage => {
    const result = run(['validate', stage], { CLOUDFLARE_API_TOKEN: '' })
    expect(result.status).toBe(0)
    expect(result.stdout).toContain(`Configuration valid for ${stage}`)
  })
})
