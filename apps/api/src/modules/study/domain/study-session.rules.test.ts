import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { DateTime, Option, Schema } from 'effect'
import { describe, expect, it } from 'vitest'

import { answeredPercent, studySessionStatus } from './study-session.rules.js'

const count = Schema.decodeSync(QuestionCount)

describe('study session status', () => {
  it('is active until the session ends', () => {
    expect(studySessionStatus({ endedAt: Option.none() })).toBe('active')
    expect(studySessionStatus({ endedAt: Option.some(DateTime.makeUnsafe(0)) })).toBe('ended')
  })
})

describe('answered percent', () => {
  it.each([
    [0, 0],
    [1, 33],
    [2, 67],
    [3, 100],
  ])('%i of 3 answered questions is %i%%', (answered, percent) =>
    expect(answeredPercent({ answeredCount: count(answered), questionCount: count(3) })).toBe(
      percent,
    ),
  )
})
