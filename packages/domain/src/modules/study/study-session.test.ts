import { Schema } from 'effect'
import { describe, expect, it } from 'vitest'
import { QuestionCount } from '~domain/modules/learning-content/reference-document.js'

import { nextQuestionPosition, SessionQuestionPosition } from './study-session.js'

const count = Schema.decodeSync(QuestionCount)
const position = Schema.decodeSync(SessionQuestionPosition)

describe('continuing after an answer', () => {
  it('moves to the following question', () =>
    expect(nextQuestionPosition(position(1), count(4))).toBe(2))

  it('stays on the last question', () =>
    expect(nextQuestionPosition(position(4), count(4))).toBe(4))
})
