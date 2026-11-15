import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { afterEach, describe, expect, it } from 'vitest'

const cli = fileURLToPath(new URL('./cli.ts', import.meta.url))
const revision = '1234567890abcdef1234567890abcdef12345678'
const directories: string[] = []

afterEach(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe('prebuilt platform artifact', () => {
  it.each([
    'matching',
    'different-revision',
    'different-stage',
    'different-api',
    'missing-bundle',
    'missing-manifest',
  ])('validates %s before deployment without building or provisioning', scenario => {
    const directory = mkdtempSync(join(tmpdir(), 'inzpro-artifact-'))
    directories.push(directory)
    const dist = join(directory, 'apps/platform/dist')
    mkdirSync(join(dist, 'server'), { recursive: true })
    mkdirSync(join(dist, 'client'))

    if (scenario !== 'missing-bundle') {
      writeFileSync(join(dist, 'server/index.js'), 'export default {}')
    }

    if (scenario !== 'missing-manifest') {
      writeFileSync(
        join(dist, 'release.json'),
        JSON.stringify({
          revision:
            scenario === 'different-revision'
              ? 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
              : revision,
          stage: scenario === 'different-stage' ? 'prod' : 'staging',
          accountId: '0123456789abcdef0123456789abcdef',
          platform: 'https://platform.staging.example.com',
          api:
            scenario === 'different-api'
              ? 'https://other.staging.example.com'
              : 'https://api.staging.example.com',
          website: 'https://www.example.com',
          cookiesDomain: 'staging.example.com',
          gtm: '',
          pixel: '',
        }),
      )
    }

    const result = spawnSync(
      process.execPath,
      ['--import', fileURLToPath(import.meta.resolve('tsx')), cli, 'validate-artifact', 'staging'],
      {
        cwd: directory,
        encoding: 'utf8',
        env: {
          ...process.env,
          GITHUB_SHA: revision,
          CLOUDFLARE_ACCOUNT_ID: '0123456789abcdef0123456789abcdef',
          CLOUDFLARE_API_TOKEN: '',
          VITE_APP_BASE_URL: 'https://platform.staging.example.com',
          VITE_API_URL: 'https://api.staging.example.com',
          VITE_MAIN_PAGE_BASE_URL: 'https://www.example.com',
          COOKIES_DOMAIN: 'staging.example.com',
          VITE_GOOGLE_TAG_MANAGER_ID: '',
          VITE_META_PIXEL_ID: '',
        },
      },
    )

    expect(result.status, result.stderr).toBe(scenario === 'matching' ? 0 : 1)

    if (scenario !== 'matching') {
      expect(result.stderr).toContain('Platform artifact missing or does not match')
    }
  })
})
