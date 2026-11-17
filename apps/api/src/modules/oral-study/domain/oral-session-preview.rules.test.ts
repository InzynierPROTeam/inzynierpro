import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { Schema } from 'effect'
import { describe, expect, it } from 'vitest'
import { oralStudySettings } from '~api/modules/oral-study/domain/oral-session-preview.rules.js'

const count = Schema.decodeSync(QuestionCount)

describe('oral study settings', () => {
  it.each([1, 4, 10])('a category with %i questions studies all of them at once', available =>
    expect(oralStudySettings(count(available))).toEqual({
      defaultQuestionCount: available,
      canChangeQuestionCount: false,
      minimumQuestionCount: available,
      maximumQuestionCount: available,
    }),
  )

  it.each([11, 120])(
    'a category with %i questions proposes ten and lets the user choose from one to all',
    available =>
      expect(oralStudySettings(count(available))).toEqual({
        defaultQuestionCount: 10,
        canChangeQuestionCount: true,
        minimumQuestionCount: 1,
        maximumQuestionCount: available,
      }),
  )
})
