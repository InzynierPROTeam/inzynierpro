import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { Option } from 'effect'
import { expect, test } from 'vitest'
import { oralReviewSettings } from '~api/modules/oral-study/domain/oral-review-session.rules.js'

test('no oral review is offered without due questions', () => {
  expect(oralReviewSettings(QuestionCount.make(0))).toEqual(Option.none())
})

test.each([
  { due: 1, defaultCount: 1, changeable: false },
  { due: 7, defaultCount: 7, changeable: true },
  { due: 10, defaultCount: 10, changeable: true },
  { due: 11, defaultCount: 10, changeable: true },
])(
  'oral reviews offer $defaultCount of $due due questions with no padding',
  ({ due, defaultCount, changeable }) => {
    expect(oralReviewSettings(QuestionCount.make(due))).toEqual(
      Option.some({
        defaultQuestionCount: defaultCount,
        canChangeQuestionCount: changeable,
        minimumQuestionCount: 1,
        maximumQuestionCount: due,
      }),
    )
  },
)
