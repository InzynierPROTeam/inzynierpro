import { ExamSessionId } from '@inzpro/domain/modules/exam-calendar/exam-session'
import { DateTime, Schema } from 'effect'
import { expect, test } from 'vitest'

import { xpPeriodsOf, xpStudyDate } from './learning-xp.rules.js'

const examSessionId = Schema.decodeSync(ExamSessionId)('90000000-0000-4000-8000-000000000002')

test.each([
  { at: '2026-11-01T22:59:59Z', day: '2026-11-01', week: '2026-10-26', month: '2026-11-01' },
  { at: '2026-11-01T23:00:00Z', day: '2026-11-02', week: '2026-11-02', month: '2026-11-01' },
  { at: '2026-03-31T22:00:00Z', day: '2026-04-01', week: '2026-03-30', month: '2026-04-01' },
  { at: '2026-12-31T23:00:00Z', day: '2027-01-01', week: '2026-12-28', month: '2027-01-01' },
])('XP at $at uses the Warsaw day and calendar periods', ({ at, day, week, month }) => {
  const awardedAt = DateTime.makeUnsafe(at)
  expect(xpStudyDate(awardedAt)).toBe(day)
  expect(xpPeriodsOf({ awardedAt, examSessionId })).toEqual([
    { kind: 'week', key: week },
    { kind: 'month', key: month },
    { kind: 'exam_session', key: examSessionId },
    { kind: 'all_time', key: 'all' },
  ])
})
