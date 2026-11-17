import { ExamDurationMinutes } from '@inzpro/domain/modules/mock-exams/exam-blueprint'
import {
  ExamActiveSeconds,
  type MockExamAttemptStatus,
} from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import { DateTime } from 'effect'
import { describe, expect, it } from 'vitest'
import type { AttemptClock } from '~api/modules/mock-exams/domain/mock-exam-attempt.model.js'
import {
  acceptsDraftWrites,
  attemptDeadline,
  attemptEnding,
  deadlineJobAction,
  isDueToExpire,
} from '~api/modules/mock-exams/domain/mock-exam-clock.rules.js'

const at = (iso: string) => DateTime.makeUnsafe(iso)

const clock = (status: MockExamAttemptStatus = 'in-progress', pauseSeconds = 0): AttemptClock => ({
  status,
  startedAt: at('2026-11-13T12:00:00.000Z'),
  durationMinutes: ExamDurationMinutes.make(10),
  pauseSeconds: ExamActiveSeconds.make(pauseSeconds),
})

describe('mock exam clock', () => {
  it('ends the attempt at the start time plus its duration and total pause time', () => {
    expect(DateTime.formatIso(attemptDeadline(clock()))).toBe('2026-11-13T12:10:00.000Z')
    expect(DateTime.formatIso(attemptDeadline(clock('in-progress', 90)))).toBe(
      '2026-11-13T12:11:30.000Z',
    )
  })

  it('accepts draft writes only while in progress and before the deadline', () => {
    expect(acceptsDraftWrites(clock(), at('2026-11-13T12:09:59.999Z'))).toBe(true)
    expect(acceptsDraftWrites(clock(), at('2026-11-13T12:10:00.000Z'))).toBe(false)
    expect(acceptsDraftWrites(clock('paused'), at('2026-11-13T12:01:00.000Z'))).toBe(false)
  })

  it('expires only an attempt in progress whose deadline has passed', () => {
    expect(isDueToExpire(clock(), at('2026-11-13T12:10:00.000Z'))).toBe(true)
    expect(isDueToExpire(clock(), at('2026-11-13T12:09:59.000Z'))).toBe(false)
    expect(isDueToExpire(clock('paused'), at('2026-11-13T13:00:00.000Z'))).toBe(false)
    expect(isDueToExpire(clock('finished'), at('2026-11-13T13:00:00.000Z'))).toBe(false)
  })

  it('submits before the deadline and otherwise ends with time expired at the deadline', () => {
    expect(attemptEnding(clock(), at('2026-11-13T12:04:00.000Z'))).toStrictEqual({
      endReason: 'submitted',
      finishedAt: at('2026-11-13T12:04:00.000Z'),
      activeSeconds: 240,
    })
    expect(attemptEnding(clock('in-progress', 60), at('2026-11-13T15:00:00.000Z'))).toStrictEqual({
      endReason: 'time-expired',
      finishedAt: at('2026-11-13T12:11:00.000Z'),
      activeSeconds: 600,
    })
  })

  it('lets a deadline job finish only the attempt it was scheduled for once time is up', () => {
    const deadline = at('2026-11-13T12:10:00.000Z')

    expect(deadlineJobAction(clock(), deadline, at('2026-11-13T12:10:01.000Z'))).toBe('finish')
    expect(deadlineJobAction(clock(), deadline, at('2026-11-13T12:09:58.000Z'))).toBe('retry')
    expect(
      deadlineJobAction(clock('in-progress', 120), deadline, at('2026-11-13T12:10:01.000Z')),
    ).toBe('skip')
    expect(deadlineJobAction(clock('paused'), deadline, at('2026-11-13T12:10:01.000Z'))).toBe(
      'skip',
    )
    expect(deadlineJobAction(clock('finished'), deadline, at('2026-11-13T12:10:01.000Z'))).toBe(
      'skip',
    )
  })
})
