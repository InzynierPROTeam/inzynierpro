import { describe, expect, it } from 'vitest'

import { getAccessReturnPath } from './utils'

describe('return after extending access', () => {
  it('preserves the requested category, search and fragment', () => {
    expect(getAccessReturnPath('/nauka/kategoria/test?tab=1#ustawienia', 'written')).toBe(
      '/nauka/kategoria/test?tab=1#ustawienia',
    )
  })

  it('does not redirect to an external origin', () => {
    expect(getAccessReturnPath('//evil.example', 'oral')).toBe('/start')
  })

  it('avoids redirect loops and defaults to the requested exam part', () => {
    expect(getAccessReturnPath('/rozszerz-dostep?egzamin=oral', 'oral')).toBe('/ustny')
    expect(getAccessReturnPath(undefined, 'written')).toBe('/nauka')
  })
})
