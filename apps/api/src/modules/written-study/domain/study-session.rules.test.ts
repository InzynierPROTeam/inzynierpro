import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { DateTime, Option, Schema } from 'effect'
import { describe, expect, it } from 'vitest'
import {
  answeredPercent,
  correctPercent,
  studySessionStatus,
} from '~api/modules/learning/domain/session-progress.rules.js'

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
    expect(
      answeredPercent({
        answeredCount: count(answered),
        questionCount: count(3),
        skippedCount: count(0),
      }),
    ).toBe(percent),
  )

  it('leaves out questions skipped after their withdrawal', () =>
    expect(
      answeredPercent({ answeredCount: count(2), questionCount: count(3), skippedCount: count(1) }),
    ).toBe(100))
})

describe('correct percent', () => {
  it.each([
    [0, 5, 0],
    [1, 1, 100],
    [1, 3, 33],
    [2, 3, 67],
    [5, 5, 100],
  ])(
    '%i correct answers in a session of %i questions are %i%%',
    (correct, questionCount, percent) =>
      expect(
        correctPercent(
          { correct: count(correct) },
          { questionCount: count(questionCount), skippedCount: count(0) },
        ),
      ).toBe(percent),
  )

  it('does not count a skipped withdrawn question against the score', () =>
    expect(
      correctPercent({ correct: count(2) }, { questionCount: count(3), skippedCount: count(1) }),
    ).toBe(100))

  it('scores nothing when every question was skipped', () =>
    expect(
      correctPercent({ correct: count(0) }, { questionCount: count(2), skippedCount: count(2) }),
    ).toBe(0))
})
