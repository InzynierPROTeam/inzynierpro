import { describe, expect, it } from 'vitest'

import { hasFormatOptionCount } from './oral-knowledge-check.js'

describe('knowledge check option count', () => {
  it.each([
    ['single_choice', 3, true],
    ['single_choice', 4, false],
    ['single_choice', 2, false],
    ['multiple_choice', 4, true],
    ['multiple_choice', 3, false],
    ['true_false', 2, true],
    ['true_false', 3, false],
  ] as const)('a %s check with %i options is valid: %s', (format, optionCount, isValid) =>
    expect(hasFormatOptionCount(format, optionCount)).toBe(isValid),
  )
})
