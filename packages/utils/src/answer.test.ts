import { describe, expect, it } from 'vitest'

import { getAnswerLetter, withAnswerLetters } from './answer.js'

describe('answer letters', () => {
  it('labels answers A to C in display order', () => {
    expect([getAnswerLetter(0), getAnswerLetter(1), getAnswerLetter(2)]).toEqual(['A', 'B', 'C'])
    expect(withAnswerLetters(['x', 'y', 'z'])).toEqual([
      ['x', 'A'],
      ['y', 'B'],
      ['z', 'C'],
    ])
  })
})
