import { Duration } from 'effect'
// @vitest-environment jsdom
// @vitest-environment-options {"url":"https://platform.example.test"}
import { afterEach, expect, test, vi } from 'vitest'

import { getCookie, getCookieOptions, removeCookie, setCookie } from './cookie.js'

afterEach(() => {
  removeCookie('preference')
  vi.restoreAllMocks()
})

test('writes host-only, secure, strict cookies with the shared default lifetime', () => {
  const write = vi.spyOn(Document.prototype, 'cookie', 'set')

  setCookie('preference', 'Wybrana ścieżka')

  expect(getCookie('preference')).toBe('Wybrana ścieżka')
  const serialized = write.mock.calls[0]?.[0]
  expect(serialized).toContain('path=/')
  expect(serialized).toContain('sameSite=strict')
  expect(serialized).toContain('secure')
  expect(serialized).toContain('max-age=604800')
  expect(serialized?.toLowerCase()).not.toContain('domain=')
})

test('only accepts lifetime configuration and ignores attempts to weaken the policy', () => {
  const options = {
    maxAge: Duration.seconds(60),
    path: '/private',
    sameSite: 'none',
    secure: false,
    domain: 'example.test',
    httpOnly: true,
  }

  expect(getCookieOptions(options)).toEqual({
    path: '/',
    sameSite: 'strict',
    secure: true,
    maxAge: 60,
  })

  const write = vi.spyOn(Document.prototype, 'cookie', 'set')
  setCookie('preference', 'selected', options)
  expect(getCookie('preference')).toBe('selected')
  expect(write.mock.calls[0]?.[0]).toContain('max-age=60')
  expect(write.mock.calls[0]?.[0]).not.toContain('domain=')
})

test('removes the cookie with matching security and scope attributes', () => {
  setCookie('preference', 'selected', { maxAge: Duration.days(365) })
  const write = vi.spyOn(Document.prototype, 'cookie', 'set')

  removeCookie('preference')

  expect(getCookie('preference')).toBeNull()
  const serialized = write.mock.calls[0]?.[0]
  expect(serialized).toContain('path=/')
  expect(serialized).toContain('sameSite=strict')
  expect(serialized).toContain('secure')
  expect(serialized).toContain('expires=')
})

test('a zero lifetime deletes an existing cookie rather than creating a session cookie', () => {
  setCookie('preference', 'selected')
  setCookie('preference', '', { maxAge: Duration.zero })

  expect(getCookie('preference')).toBeNull()
})
