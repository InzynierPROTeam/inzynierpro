import { describe, expect, it } from 'vitest'
import { BASE_OPTIONS, getAuthClient } from '~auth-client/index.js'

describe('auth client', () => {
  it('targets the Better Auth route mounted by the API', () => {
    expect(BASE_OPTIONS.basePath).toBe('/api/v1/auth')
  })

  it('leaves the API URL and fetch options to the application', () => {
    expect(BASE_OPTIONS).not.toHaveProperty('baseURL')
    expect(BASE_OPTIONS).not.toHaveProperty('fetchOptions')
    expect(getAuthClient({ baseURL: 'https://api.example.com' })).toBeTruthy()
  })
})
