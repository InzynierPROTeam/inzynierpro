import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { Schema } from 'effect'
import { describe, expect, it } from 'vitest'

import { writtenStudySettings } from './session-preview.rules.js'

const count = Schema.decodeSync(QuestionCount)

describe('written study settings', () => {
  it.each([0, 1, 25])('a document with %i questions studies all of them at once', available =>
    expect(writtenStudySettings(count(available))).toEqual({
      defaultQuestionCount: available,
      canChangeQuestionCount: false,
      minimumQuestionCount: available,
      maximumQuestionCount: available,
    }),
  )

  it.each([26, 300])(
    'a document with %i questions lets the user choose from one to all',
    available =>
      expect(writtenStudySettings(count(available))).toEqual({
        defaultQuestionCount: available,
        canChangeQuestionCount: true,
        minimumQuestionCount: 1,
        maximumQuestionCount: available,
      }),
  )
})
