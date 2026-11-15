import {
  SessionPreview,
  SessionQuestion,
  StudySessionProgress,
} from '@inzpro/api-contracts/modules/study/responses'
import { SessionQuestionPosition } from '@inzpro/domain/modules/study/study-session'
import { Option, Schema } from 'effect'
import { describe, expect, it } from 'vitest'

import {
  getSessionQuestionCount,
  sessionNextStep,
  sessionWithdrawalNotice,
  withdrawnQuestion,
} from './utils'
import { LearningPreviewSearch } from './validation'

const position = Schema.decodeSync(SessionQuestionPosition)

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

const progress = (answered: number, skipped: number) =>
  Schema.decodeSync(StudySessionProgress)({
    total: 3,
    answered,
    skipped,
    percent: 0,
    currentQuestion: 1,
  })

describe('the step after a closed session question', () => {
  it('moves on while questions are still open', () =>
    expect(sessionNextStep(position(1), { status: 'active', progress: progress(1, 0) })).toBe(
      'next',
    ))

  it('ends the session from its last question', () =>
    expect(sessionNextStep(position(3), { status: 'active', progress: progress(2, 0) })).toBe(
      'end',
    ))

  it('ends the session when every remaining question was withdrawn', () =>
    expect(sessionNextStep(position(1), { status: 'active', progress: progress(1, 2) })).toBe(
      'end',
    ))

  it('leads to the summary of an ended session', () =>
    expect(sessionNextStep(position(1), { status: 'ended', progress: progress(1, 0) })).toBe(
      'summary',
    ))
})

const question = Schema.decodeSync(SessionQuestion)({
  sessionId: '50000000-0000-4000-8000-000000000001',
  position: 1,
  questionId: '30000000-0000-4000-8000-000000000001',
  questionRevisionId: '40000000-0000-4000-8000-000000000001',
  body: 'Question',
  explanation: 'Explanation',
  answers: [{ id: '41000000-0000-4000-8000-000000000001', text: 'A', isCorrect: true }],
  isWithdrawn: false,
  explanationOpenedAt: null,
  answer: {
    answerId: '41000000-0000-4000-8000-000000000001',
    isCorrect: true,
    isAssisted: false,
    answeredAt: '2026-01-01T00:00:00.000Z',
  },
})

describe('a submission refused because the question was withdrawn', () => {
  it('drops the optimistic result and shows the question as withdrawn', () =>
    expect(withdrawnQuestion(question)).toEqual({ ...question, isWithdrawn: true, answer: null }))
})

describe('the withdrawal notice of a session question', () => {
  const shown = (questionNumber: number, isWithdrawn: boolean) => ({
    position: position(questionNumber),
    isWithdrawn,
    answer: null,
  })

  const active = (answered: number, skipped: number) => ({
    status: 'active' as const,
    progress: progress(answered, skipped),
  })

  it('tells that a withdrawn question is skipped while others are still open', () =>
    expect(sessionWithdrawalNotice(shown(2, true), active(1, 1))).toBe('question'))

  it('shows only that nothing is left once every remaining question was withdrawn', () => {
    expect(sessionWithdrawalNotice(shown(2, true), active(1, 2))).toBe('remaining')
    expect(sessionWithdrawalNotice(shown(3, true), active(1, 2))).toBe('remaining')
  })

  it('explains the end on an answered question followed only by withdrawn ones', () =>
    expect(
      sessionWithdrawalNotice({ ...shown(1, false), answer: question.answer }, active(1, 2)),
    ).toBe('remaining'))

  it('adds nothing to the last question answered as usual', () =>
    expect(sessionWithdrawalNotice(shown(3, false), active(2, 1))).toBeNull())

  it('keeps marking a withdrawn question in an ended session', () =>
    expect(
      sessionWithdrawalNotice(shown(2, true), { ...active(1, 2), status: 'ended' as const }),
    ).toBe('question'))
})
