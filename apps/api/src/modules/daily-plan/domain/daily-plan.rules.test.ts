import {
  DailyPlanSettingsVersion,
  DailyQuestionCount,
  defaultDailyPlanSettingsVersion,
} from '@inzpro/domain/modules/daily-plan/daily-plan'
import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { DateTime, Effect, Exit, Option, Schema } from 'effect'
import { describe, expect, it } from 'vitest'
import {
  type DailyPlanRecord,
  type DailyPlanSettings,
  defaultDailyPlanSettings,
  type PlanPreference,
} from '~api/modules/daily-plan/domain/daily-plan.model.js'
import {
  acceptsPlanPreference,
  changedDailyPlanSettings,
  closesPlannedRound,
  dailyPlanOf,
  draftDailyPlan,
  isCountedPlanAnswer,
  replanDailyPlan,
} from '~api/modules/daily-plan/domain/daily-plan.rules.js'
import {
  InvalidPlanPreference,
  StaleDailyPlanSettings,
} from '~api/modules/daily-plan/domain/errors.js'
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

const settings = (preference: PlanPreference, version = 2): DailyPlanSettings => ({
  version: DailyPlanSettingsVersion.make(version),
  preference,
})

const ownDate = (targetDate: string, version?: number) =>
  settings({ mode: 'target_date', targetDate: at(targetDate) }, version)

const dailyCount = (questions: number) =>
  settings({ mode: 'daily_count', dailyQuestionCount: DailyQuestionCount.make(questions) })

const draft = (
  examAt: string,
  questions: number,
  covered = 0,
  planSettings = defaultDailyPlanSettings,
) =>
  draftDailyPlan({
    now,
    examAt: at(examAt),
    progress: progress(questions, covered),
    settings: planSettings,
  }).pipe(Option.getOrThrow)

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
      draftDailyPlan({
        now,
        examAt: at('2026-12-20T08:00:00.000Z'),
        progress: progress(0, 0),
        settings: defaultDailyPlanSettings,
      }),
    ).toEqual(Option.none())
    expect(
      draftDailyPlan({
        now,
        examAt: at('2026-11-12T07:00:00.000Z'),
        progress: progress(5, 0),
        settings: defaultDailyPlanSettings,
      }),
    ).toEqual(Option.none())
  })
})

const plan = (input: {
  readonly examAt?: string
  readonly record?: Option.Option<DailyPlanRecord>
  readonly paceStart?: Option.Option<DailyPlanRecord>
  readonly settings?: DailyPlanSettings
}) =>
  dailyPlanOf({
    now,
    examAt: at(input.examAt ?? '2026-12-20T08:00:00.000Z'),
    record: input.record ?? Option.some(record()),
    paceStart: input.paceStart ?? Option.none(),
    settings: input.settings ?? defaultDailyPlanSettings,
  })

describe('the daily plan state', () => {
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
      settings: defaultDailyPlanSettings,
    })
    expect(plan({ examAt: '2026-11-01T07:00:00.000Z', record: Option.none() })).toMatchObject({
      status: 'exam_passed',
    })
  })

  it('has no material without a frozen record', () =>
    expect(plan({ record: Option.none() })).toEqual({
      status: 'no_material',
      settings: defaultDailyPlanSettings,
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
        paceStart: Option.some(
          record({
            studyDay: at('2026-11-09T23:00:00.000Z'),
            remainingQuestionCount: count(30),
          }),
        ),
      }),
    ).toMatchObject({ questionsBehindPace: 4 }))
})

describe('an own preparation end date', () => {
  it('replaces the buffer as the target date', () =>
    expect(
      draft('2026-12-20T08:00:00.000Z', 62, 0, ownDate('2026-11-21T23:00:00.000Z')),
    ).toMatchObject({
      targetDate: at('2026-11-21T23:00:00.000Z'),
      targetQuestionCount: 7,
      settingsVersion: 2,
    }))

  it('may fall inside the default buffer', () =>
    expect(
      draft('2026-11-20T08:00:00.000Z', 10, 0, ownDate('2026-11-14T23:00:00.000Z')),
    ).toMatchObject({ targetDate: at('2026-11-14T23:00:00.000Z'), targetQuestionCount: 4 }))

  it('falls back to the day before the exam once it has passed', () =>
    expect(
      draft('2026-11-20T08:00:00.000Z', 10, 0, ownDate('2026-11-10T23:00:00.000Z')),
    ).toMatchObject({ targetDate: at('2026-11-18T23:00:00.000Z'), targetQuestionCount: 2 }))

  it('is accepted from today until the day before the exam', () => {
    const accepts = (targetDate: string) =>
      acceptsPlanPreference({
        now,
        examAt: at('2026-11-20T08:00:00.000Z'),
        preference: { mode: 'target_date', targetDate: at(targetDate) },
      })

    expect(accepts('2026-11-12T23:00:00.000Z')).toBe(true)
    expect(accepts('2026-11-18T23:00:00.000Z')).toBe(true)
    expect(accepts('2026-11-11T23:00:00.000Z')).toBe(false)
    expect(accepts('2026-11-19T23:00:00.000Z')).toBe(false)
  })

  it('reports the final days only after the own date has passed', () => {
    expect(
      plan({
        examAt: '2026-11-20T08:00:00.000Z',
        settings: ownDate('2026-11-14T23:00:00.000Z'),
        record: Option.some(record({ targetDate: at('2026-11-14T23:00:00.000Z') })),
      }),
    ).toMatchObject({ status: 'planned' })
    expect(
      plan({
        examAt: '2026-11-20T08:00:00.000Z',
        settings: ownDate('2026-11-10T23:00:00.000Z'),
        record: Option.some(record({ targetDate: at('2026-11-18T23:00:00.000Z') })),
      }),
    ).toMatchObject({ status: 'final_days' })
  })
})

describe('a fixed number of questions per day', () => {
  it('is the target, and the target date is the day the pool runs out at that pace', () =>
    expect(draft('2026-12-20T08:00:00.000Z', 62, 0, dailyCount(20))).toMatchObject({
      targetDate: at('2026-11-15T23:00:00.000Z'),
      targetQuestionCount: 20,
    }))

  it('never asks for more than the uncovered questions', () =>
    expect(draft('2026-12-20T08:00:00.000Z', 62, 50, dailyCount(20))).toMatchObject({
      targetDate: at('2026-11-12T23:00:00.000Z'),
      targetQuestionCount: 12,
    }))

  it('is planned without final days close to the exam', () =>
    expect(
      plan({
        examAt: '2026-11-20T08:00:00.000Z',
        settings: dailyCount(20),
        record: Option.some(record({ targetDate: at('2026-11-15T23:00:00.000Z') })),
      }),
    ).toMatchObject({ status: 'planned' }))

  it('counts the questions behind the chosen count since the settings took effect', () =>
    expect(
      plan({
        settings: dailyCount(5),
        record: Option.some(
          record({
            remainingQuestionCount: count(52),
            targetQuestionCount: count(5),
            completedQuestionCount: count(1),
          }),
        ),
        paceStart: Option.some(
          record({
            studyDay: at('2026-11-09T23:00:00.000Z'),
            remainingQuestionCount: count(60),
          }),
        ),
      }),
    ).toMatchObject({ questionsBehindPace: 6 }))
})

describe("a deliberate change of today's plan", () => {
  const today = record({
    remainingQuestionCount: count(62),
    targetQuestionCount: count(2),
    completedQuestionCount: count(5),
  })

  it('recomputes the target from the questions uncovered at the start of the day', () =>
    expect(
      replanDailyPlan({
        now,
        examAt: at('2026-12-20T08:00:00.000Z'),
        record: today,
        settings: ownDate('2026-11-21T23:00:00.000Z'),
      }),
    ).toEqual({
      studyDay: today.studyDay,
      round: today.round,
      remainingQuestionCount: count(62),
      targetDate: at('2026-11-21T23:00:00.000Z'),
      targetQuestionCount: count(7),
      settingsVersion: 2,
    }))

  it('brings back the buffer when the default is restored', () =>
    expect(
      replanDailyPlan({
        now,
        examAt: at('2026-12-20T08:00:00.000Z'),
        record: today,
        settings: settings({ mode: 'default' }, 3),
      }),
    ).toMatchObject({
      targetDate: at('2026-12-12T23:00:00.000Z'),
      targetQuestionCount: 2,
      settingsVersion: 3,
    }))
})

describe('a change of the plan settings', () => {
  const change = (preference: PlanPreference, expectedVersion = 2) =>
    Effect.runSyncExit(
      changedDailyPlanSettings({
        now,
        examAt: at('2026-11-20T08:00:00.000Z'),
        current: dailyCount(20),
        expectedVersion: DailyPlanSettingsVersion.make(expectedVersion),
        preference,
      }),
    )

  it('takes the next version and stores an own date as the start of its Warsaw day', () =>
    expect(change({ mode: 'target_date', targetDate: at('2026-11-15T10:00:00.000Z') })).toEqual(
      Exit.succeed(Option.some(ownDate('2026-11-14T23:00:00.000Z', 3))),
    ))

  it('restores the default with a new version', () =>
    expect(change({ mode: 'default' })).toEqual(
      Exit.succeed(Option.some(settings({ mode: 'default' }, 3))),
    ))

  it('is not needed when the preference is already in place, whatever the version', () =>
    expect(
      change({ mode: 'daily_count', dailyQuestionCount: DailyQuestionCount.make(20) }, 1),
    ).toEqual(Exit.succeed(Option.none())))

  it('refuses a stale settings version', () =>
    expect(change({ mode: 'default' }, 1)).toEqual(Exit.fail(new StaleDailyPlanSettings())))

  it('refuses an own date that is not between today and the day before the exam', () =>
    expect(change({ mode: 'target_date', targetDate: at('2026-11-20T08:00:00.000Z') })).toEqual(
      Exit.fail(new InvalidPlanPreference()),
    ))
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
