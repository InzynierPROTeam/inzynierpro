import { SessionPreview } from '@inzpro/api-contracts/modules/study/responses'
import { Option, Schema } from 'effect'
import { describe, expect, it } from 'vitest'

import { getSessionQuestionCount } from './utils'
import { LearningPreviewSearch } from './validation'

const settings = Schema.decodeSync(SessionPreview.fields.settings)({
  defaultQuestionCount: 30,
  canChangeQuestionCount: true,
  minimumQuestionCount: 1,
  maximumQuestionCount: 30,
})

describe('session preview selection', () => {
  it('supports the v1 start route with default, explicit or following category', () => {
    const id = '20000000-0000-4000-8000-000000000001'
    expect(Schema.decodeSync(LearningPreviewSearch)({})).toEqual({})
    expect(
      Schema.decodeSync(LearningPreviewSearch)({ 'akt-prawny': id, 'liczba-pytan': 10 }),
    ).toEqual({ 'akt-prawny': id, 'liczba-pytan': 10 })
    expect(Schema.decodeSync(LearningPreviewSearch)({ 'obecny-akt-prawny': id })).toEqual({
      'obecny-akt-prawny': id,
    })
    expect(
      Option.isNone(Schema.decodeOption(LearningPreviewSearch)({ 'akt-prawny': 'invalid' })),
    ).toBe(true)
    expect(Option.isNone(Schema.decodeOption(LearningPreviewSearch)({ 'liczba-pytan': -1 }))).toBe(
      true,
    )
  })

  it('uses backend defaults for absent or out-of-range URL limits', () => {
    expect(getSessionQuestionCount(settings, undefined)).toBe(30)
    expect(getSessionQuestionCount(settings, 10)).toBe(10)
    expect(getSessionQuestionCount(settings, 0)).toBe(30)
    expect(getSessionQuestionCount(settings, 31)).toBe(30)
  })

  it('ignores saved URL limits when backend settings no longer allow a choice', () => {
    const fixed = Schema.decodeSync(SessionPreview.fields.settings)({
      defaultQuestionCount: 25,
      canChangeQuestionCount: false,
      minimumQuestionCount: 25,
      maximumQuestionCount: 25,
    })

    expect(getSessionQuestionCount(fixed, 10)).toBe(25)
  })
})
