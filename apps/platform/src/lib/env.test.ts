import { describe, expect, it } from 'vitest'

import { readClientEnv } from './env'
import { readServerEnv } from './env.server'

const values = {
  VITE_API_URL: 'http://localhost:4000',
  VITE_APP_BASE_URL: 'http://localhost:8001',
  VITE_MAIN_PAGE_BASE_URL: 'http://localhost:8000',
}

describe('platform environment', () => {
  it('uses the default port only when a port is missing', () => {
    expect(readServerEnv({})).toEqual({ PORT: 8001 })
    expect(readServerEnv({ PORT: '8123' })).toEqual({ PORT: 8123 })
  })

  it.each(['abc', '0', '65536', '8001.5'])('rejects an invalid port: %s', PORT => {
    expect(() => readServerEnv({ PORT })).toThrow()
  })

  it('does not require tracking configuration to start the application', () => {
    const config = readClientEnv(values)

    expect(config).toEqual({
      VITE_API_URL: new URL(values.VITE_API_URL),
      VITE_APP_BASE_URL: new URL(values.VITE_APP_BASE_URL),
      VITE_MAIN_PAGE_BASE_URL: new URL(values.VITE_MAIN_PAGE_BASE_URL),
      VITE_GOOGLE_TAG_MANAGER_ID: '',
      VITE_META_PIXEL_ID: '',
    })
  })

  it.each(['VITE_API_URL', 'VITE_APP_BASE_URL', 'VITE_MAIN_PAGE_BASE_URL'])(
    'rejects a missing or malformed URL: %s',
    key => {
      for (const value of [undefined, 'invalid']) {
        expect(() => readClientEnv({ ...values, [key]: value })).toThrow()
      }
    },
  )
})
