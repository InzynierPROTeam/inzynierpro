import { DateTime } from 'effect'
import { describe, expect, it } from 'vitest'

import { getCurrentFullYear } from './date.js'
import { getCanonicalHref, seoFactory } from './seo.js'

describe('shared display helpers', () => {
  it('builds metadata from consumer-supplied branding and locale', () => {
    const seo = seoFactory({ titleSuffix: 'Example', siteName: 'Site', locale: 'pl-PL' })

    expect(seo({ title: 'Home' })).toContainEqual({ title: 'Home | Example' })
    expect(seo()).toContainEqual({ name: 'og:locale', content: 'pl-PL' })
    expect(seo()).toContainEqual({ name: 'og:site_name', content: 'Site' })
  })

  it('normalizes canonical URLs without search or fragment state', () => {
    expect(getCanonicalHref('/example/?ref=test#section', 'https://example.com')).toBe(
      'https://example.com/example/',
    )
    expect(getCanonicalHref('/?ref=test', 'https://example.com')).toBe('https://example.com/')
  })

  it.each(['/example', '/example/', '/example///'])(
    'uses one trailing slash for canonical path %s',
    path => {
      expect(getCanonicalHref(path, 'https://example.com')).toBe('https://example.com/example/')
    },
  )

  it('uses the consumer time zone at a year boundary', () => {
    const date = DateTime.makeUnsafe('2026-12-31T23:30:00Z')

    expect(getCurrentFullYear(date, 'UTC')).toBe(2026)
    expect(getCurrentFullYear(date, 'Europe/Warsaw')).toBe(2027)
  })
})
