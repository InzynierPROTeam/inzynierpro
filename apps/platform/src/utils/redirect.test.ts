import { describe, expect, it } from 'vitest'

import { defaultSignedInPath, safeRedirectPath } from './redirect'

describe('redirect after sign-in', () => {
  it('keeps an in-app path with its search and hash', () => {
    expect(safeRedirectPath('/start?tab=1#top')).toBe('/start?tab=1#top')
  })

  it.each([
    undefined,
    '',
    'start',
    'https://evil.example/start',
    '//evil.example',
    '/\\evil.example',
    'javascript:alert(1)',
  ])('falls back to the signed-in home for %s', value => {
    expect(safeRedirectPath(value)).toBe(defaultSignedInPath)
  })
})
