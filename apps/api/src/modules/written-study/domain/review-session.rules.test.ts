import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { Option, Schema } from 'effect'
import { describe, expect, it } from 'vitest'
import { reviewSessionSettings } from '~api/modules/written-study/domain/review-session.rules.js'

const count = Schema.decodeSync(QuestionCount)

describe('review session settings', () => {
  it('offers up to 25 of many due questions and allows any count up to all of them', () =>
    expect(reviewSessionSettings(count(40))).toStrictEqual(
      Option.some({
        defaultQuestionCount: 25,
        canChangeQuestionCount: true,
        minimumQuestionCount: 1,
        maximumQuestionCount: 40,
      }),
    ))

  it('never pads a session beyond the due questions', () =>
    expect(reviewSessionSettings(count(7))).toStrictEqual(
      Option.some({
        defaultQuestionCount: 7,
        canChangeQuestionCount: true,
        minimumQuestionCount: 1,
        maximumQuestionCount: 7,
      }),
    ))

  it('fixes the count of a single due question', () =>
    expect(reviewSessionSettings(count(1))).toStrictEqual(
      Option.some({
        defaultQuestionCount: 1,
        canChangeQuestionCount: false,
        minimumQuestionCount: 1,
        maximumQuestionCount: 1,
      }),
    ))

  it('offers no session when nothing is due', () =>
    expect(reviewSessionSettings(count(0))).toStrictEqual(Option.none()))
})
