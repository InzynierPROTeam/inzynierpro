import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { Schema } from 'effect'
import { describe, expect, it } from 'vitest'

import {
  isAllowedQuestionCount,
  sessionQuestionPool,
  writtenStudySettings,
} from './session-preview.rules.js'

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

describe('starting a written study session', () => {
  it('refuses a document without published questions', () =>
    expect(isAllowedQuestionCount(writtenStudySettings(count(0)), count(0))).toBe(false))

  it('accepts only every question when the count cannot change', () => {
    const settings = writtenStudySettings(count(25))

    expect(isAllowedQuestionCount(settings, count(25))).toBe(true)
    expect(isAllowedQuestionCount(settings, count(10))).toBe(false)
  })

  it('accepts a chosen count from one to all above the threshold', () => {
    const settings = writtenStudySettings(count(26))

    expect(isAllowedQuestionCount(settings, count(1))).toBe(true)
    expect(isAllowedQuestionCount(settings, count(26))).toBe(true)
    expect(isAllowedQuestionCount(settings, count(27))).toBe(false)
  })
})

describe('choosing the questions of the next session', () => {
  it('draws the questions not yet answered in regular study', () =>
    expect(
      sessionQuestionPool({ availableQuestionCount: count(5), completedQuestionCount: count(2) }),
    ).toEqual({ selection: 'unanswered', questionCount: 3 }))

  it('repeats every question once all of them were answered', () =>
    expect(
      sessionQuestionPool({ availableQuestionCount: count(5), completedQuestionCount: count(5) }),
    ).toEqual({ selection: 'repeat', questionCount: 5 }))

  it('offers nothing for a document without published questions', () =>
    expect(
      sessionQuestionPool({ availableQuestionCount: count(0), completedQuestionCount: count(0) }),
    ).toEqual({ selection: 'unanswered', questionCount: 0 }))
})
