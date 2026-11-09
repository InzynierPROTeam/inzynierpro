import { describe, expect, it } from 'vitest'

import { getSingletonQueryClientFactory } from './shared.js'

describe('QueryClient lifetime', () => {
  it('isolates server requests and their cached account data', () => {
    const getClient = getSingletonQueryClientFactory(undefined, { isServer: () => true })
    const first = getClient()
    first.setQueryData(['session'], { userId: 'first' })
    const second = getClient()

    expect(second).not.toBe(first)
    expect(second.getQueryData(['session'])).toBeUndefined()
  })

  it('retains browser cache across router access', () => {
    const getClient = getSingletonQueryClientFactory(undefined, { isServer: () => false })
    getClient().setQueryData(['catalog'], ['path'])

    expect(getClient().getQueryData(['catalog'])).toEqual(['path'])
  })
})
