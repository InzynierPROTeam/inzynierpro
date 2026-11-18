import { defaultDailyPlanSettingsVersion } from '@inzpro/domain/modules/daily-plan/daily-plan'
import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { DateTime, Option, Schema } from 'effect'
import { describe, expect, it } from 'vitest'
import type { DailyPlanRecord } from '~api/modules/daily-plan/domain/daily-plan.model.js'
import {
  closesPlannedRound,
  dailyPlanOf,
  draftDailyPlan,
  isCountedPlanAnswer,
} from '~api/modules/daily-plan/domain/daily-plan.rules.js'
import { LearningRoundNumber } from '~api/modules/learning/domain/learning-round.model.js'

const count = Schema.decodeSync(QuestionCount)

const round = Schema.decodeSync(LearningRoundNumber)

const at = DateTime.makeUnsafe

const iso = (value: DateTime.Utc) => DateTime.formatIso(value)

const progress = (questions: number, covered: number, stored = 1) => ({
  round: round(stored),
  questionCount: count(questions),
  coveredQuestionCount: count(covered),
})

const now = at('2026-11-13T12:00:00.000Z')

const draft = (examAt: string, questions: number, covered = 0) =>
  draftDailyPlan({ now, examAt: at(examAt), progress: progress(questions, covered) }).pipe(
    Option.getOrThrow,
  )

const record = (overrides: Partial<DailyPlanRecord> = {}): DailyPlanRecord => ({
  studyDay: at('2026-11-12T23:00:00.000Z'),
  round: round(1),
  targetDate: at('2026-12-12T23:00:00.000Z'),
  remainingQuestionCount: count(62),
  targetQuestionCount: count(2),
  completedQuestionCount: count(0),
  settingsVersion: defaultDailyPlanSettingsVersion,
  roundCompletedAt: Option.none(),
  ...overrides,
})

describe('the daily plan target date', () => {
  it('is the Warsaw day a week before the exam', () =>
    expect(iso(draft('2026-12-20T08:00:00.000Z', 62).targetDate)).toBe('2026-12-12T23:00:00.000Z'))

  it('follows Warsaw summer time', () =>
    expect(iso(draft('2027-05-21T07:00:00.000Z', 62).targetDate)).toBe('2027-05-13T22:00:00.000Z'))

  it('keeps the buffer while more than a buffer of days remains', () =>
    expect(iso(draft('2026-11-21T08:00:00.000Z', 10).targetDate)).toBe('2026-11-13T23:00:00.000Z'))

  it('shrinks to the day before the exam when fewer than buffer + 1 days remain', () =>
    expect(iso(draft('2026-11-20T08:00:00.000Z', 10).targetDate)).toBe('2026-11-18T23:00:00.000Z'))
})

describe("today's target", () => {
  it('spreads the uncovered questions over the days until the target date, today included', () => {
    expect(draft('2026-12-20T08:00:00.000Z', 62).targetQuestionCount).toBe(2)
    expect(draft('2026-12-20T08:00:00.000Z', 63).targetQuestionCount).toBe(3)
    expect(draft('2026-12-20T08:00:00.000Z', 80, 18).targetQuestionCount).toBe(2)
  })

  it('records the uncovered questions it was computed from', () =>
    expect(draft('2026-12-20T08:00:00.000Z', 80, 18).remainingQuestionCount).toBe(62))

  it('plans the whole pool of the next round once the stored round is covered', () =>
    expect(draft('2026-12-20T08:00:00.000Z', 62, 62)).toMatchObject({
      round: 2,
      remainingQuestionCount: 62,
      targetQuestionCount: 2,
    }))

  it('is the whole remainder on the last day before the exam', () =>
    expect(draft('2026-11-14T08:00:00.000Z', 9).targetQuestionCount).toBe(9))

  it('is zero on the exam day', () =>
    expect(draft('2026-11-13T07:00:00.000Z', 9)).toMatchObject({
      targetDate: at('2026-11-12T23:00:00.000Z'),
      targetQuestionCount: 0,
    }))

  it('is not planned without material or after the exam', () => {
    expect(
      draftDailyPlan({ now, examAt: at('2026-12-20T08:00:00.000Z'), progress: progress(0, 0) }),
    ).toEqual(Option.none())
    expect(
      draftDailyPlan({ now, examAt: at('2026-11-12T07:00:00.000Z'), progress: progress(5, 0) }),
    ).toEqual(Option.none())
  })
})

describe('the daily plan state', () => {
  const plan = (input: {
    readonly examAt?: string
    readonly record?: Option.Option<DailyPlanRecord>
    readonly roundStart?: Option.Option<DailyPlanRecord>
  }) =>
    dailyPlanOf({
      now,
      examAt: at(input.examAt ?? '2026-12-20T08:00:00.000Z'),
      record: input.record ?? Option.some(record()),
      roundStart: input.roundStart ?? Option.none(),
    })

  it('is planned while the target date is ahead', () =>
    expect(plan({})).toMatchObject({
      status: 'planned',
      daysUntilExam: 37,
      targetQuestionCount: 2,
      questionsBehindPace: 0,
    }))

  it('reports the final days when fewer than buffer + 1 days remain', () =>
    expect(
      plan({
        examAt: '2026-11-20T08:00:00.000Z',
        record: Option.some(record({ targetDate: at('2026-11-18T23:00:00.000Z') })),
      }),
    ).toMatchObject({ status: 'final_days', daysUntilExam: 7 }))

  it('reports a completed round with no target for the rest of the day', () =>
    expect(
      plan({ record: Option.some(record({ roundCompletedAt: Option.some(now) })) }),
    ).toMatchObject({ status: 'round_completed', targetQuestionCount: 0, questionsBehindPace: 0 }))

  it('keeps the plan without pace on the exam day', () =>
    expect(
      plan({
        examAt: '2026-11-13T07:00:00.000Z',
        record: Option.some(record({ targetDate: now, targetQuestionCount: count(0) })),
      }),
    ).toMatchObject({ status: 'final_days', daysUntilExam: 0, questionsBehindPace: 0 }))

  it('asks for a new goal from the day after the exam', () => {
    expect(plan({ examAt: '2026-11-12T07:00:00.000Z' })).toEqual({
      status: 'exam_passed',
      examDay: at('2026-11-11T23:00:00.000Z'),
    })
    expect(plan({ examAt: '2026-11-01T07:00:00.000Z', record: Option.none() })).toMatchObject({
      status: 'exam_passed',
    })
  })

  it('has no material without a frozen record', () =>
    expect(plan({ record: Option.none() })).toEqual({
      status: 'no_material',
    }))

  it('counts the questions behind a linear pace from the first day of the round', () =>
    expect(
      plan({
        examAt: '2026-11-20T08:00:00.000Z',
        record: Option.some(
          record({
            targetDate: at('2026-11-18T23:00:00.000Z'),
            remainingQuestionCount: count(27),
            targetQuestionCount: count(4),
            completedQuestionCount: count(2),
          }),
        ),
        roundStart: Option.some(
          record({
            studyDay: at('2026-11-09T23:00:00.000Z'),
            remainingQuestionCount: count(30),
          }),
        ),
      }),
    ).toMatchObject({ questionsBehindPace: 4 }))
})

describe('an answer in the daily plan', () => {
  it('counts only when it covers a question in the round', () => {
    expect(isCountedPlanAnswer({ before: progress(5, 2), after: progress(5, 3) })).toBe(true)
    expect(isCountedPlanAnswer({ before: progress(5, 2), after: progress(5, 2) })).toBe(false)
  })

  it('closes the planned round once every question is covered', () => {
    expect(closesPlannedRound({ before: progress(5, 4), after: progress(5, 5) })).toBe(true)
    expect(closesPlannedRound({ before: progress(5, 3), after: progress(5, 4) })).toBe(false)
  })
})
