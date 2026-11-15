import { Schema } from 'effect'
import { describe, expect, it } from 'vitest'
import { QuestionCount } from '~domain/modules/learning-content/reference-document.js'

import {
  hasOpenQuestions,
  nextQuestionPosition,
  scoredQuestionCount,
  SessionQuestionPosition,
} from './study-session.js'

const count = Schema.decodeSync(QuestionCount)
const position = Schema.decodeSync(SessionQuestionPosition)

describe('continuing after an answer', () => {
  it('moves to the following question', () =>
    expect(nextQuestionPosition(position(1), count(4))).toBe(2))

  it('stays on the last question', () =>
    expect(nextQuestionPosition(position(4), count(4))).toBe(4))
})

describe('skipping withdrawn questions', () => {
  it('scores only the questions not withdrawn before an answer', () =>
    expect(scoredQuestionCount({ total: count(5), skipped: count(2) })).toBe(3))

  it('keeps questions open while some are neither answered nor skipped', () =>
    expect(hasOpenQuestions({ total: count(3), answered: count(1), skipped: count(1) })).toBe(true))

  it('leaves nothing open once every remaining question is withdrawn', () =>
    expect(hasOpenQuestions({ total: count(3), answered: count(1), skipped: count(2) })).toBe(
      false,
    ))
})
