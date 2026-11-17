import { ExamDurationMinutes } from '@inzpro/domain/modules/mock-exams/exam-blueprint'
import type { MockExamAttemptStatus } from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import { DateTime, Option } from 'effect'
import { describe, expect, it } from 'vitest'
import type {
  AttemptClock,
  AttemptPause,
} from '~api/modules/mock-exams/domain/mock-exam-attempt.model.js'
import {
  acceptsDraftWrites,
  acceptsPause,
  attemptDeadline,
  attemptEnding,
  deadlineJobAction,
  isDueToExpire,
} from '~api/modules/mock-exams/domain/mock-exam-clock.rules.js'

const at = (iso: string) => DateTime.makeUnsafe(iso)

const pause = (pausedAt: string, endedAt?: string): AttemptPause => ({
  pausedAt: at(pausedAt),
  endedAt: endedAt === undefined ? Option.none() : Option.some(at(endedAt)),
})

const minutePause = (minutes: number) =>
  pause('2026-11-13T12:01:00.000Z', `2026-11-13T12:${String(1 + minutes).padStart(2, '0')}:00.000Z`)

const clock = (
  status: MockExamAttemptStatus = 'in-progress',
  pauses: ReadonlyArray<AttemptPause> = [],
): AttemptClock => ({
  status,
  startedAt: at('2026-11-13T12:00:00.000Z'),
  durationMinutes: ExamDurationMinutes.make(10),
  pauses,
})

const noon = at('2026-11-13T12:00:00.000Z')

describe('mock exam clock', () => {
  it('ends the attempt at the start time plus its duration and total pause time', () => {
    expect(DateTime.formatIso(attemptDeadline(clock(), noon))).toBe('2026-11-13T12:10:00.000Z')
    expect(
      DateTime.formatIso(
        attemptDeadline(
          clock('in-progress', [
            pause('2026-11-13T12:01:00.000Z', '2026-11-13T12:02:00.000Z'),
            pause('2026-11-13T12:03:00.000Z', '2026-11-13T12:03:30.250Z'),
          ]),
          noon,
        ),
      ),
    ).toBe('2026-11-13T12:11:30.250Z')
  })

  it('moves the deadline with backend time while the attempt is paused', () => {
    const paused = clock('paused', [pause('2026-11-13T12:04:00.000Z')])

    expect(DateTime.formatIso(attemptDeadline(paused, at('2026-11-13T12:30:00.000Z')))).toBe(
      '2026-11-13T12:36:00.000Z',
    )
    expect(isDueToExpire(paused, at('2026-11-13T13:00:00.000Z'))).toBe(false)
  })

  it('accepts a pause only while the attempt is in progress and before its deadline', () => {
    expect(acceptsPause(clock(), at('2026-11-13T12:09:59.999Z'))).toBe(true)
    expect(acceptsPause(clock(), at('2026-11-13T12:10:00.000Z'))).toBe(false)
    expect(acceptsPause(clock('paused'), at('2026-11-13T12:01:00.000Z'))).toBe(false)
    expect(acceptsPause(clock('finished'), at('2026-11-13T12:01:00.000Z'))).toBe(false)
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
      pauseCount: 0,
      pauseSeconds: 0,
    })
    expect(
      attemptEnding(clock('in-progress', [minutePause(1)]), at('2026-11-13T15:00:00.000Z')),
    ).toStrictEqual({
      endReason: 'time-expired',
      finishedAt: at('2026-11-13T12:11:00.000Z'),
      activeSeconds: 600,
      pauseCount: 1,
      pauseSeconds: 60,
    })
  })

  it('excludes every pause, including one still open, from the active time when finishing', () => {
    const paused = clock('paused', [minutePause(2), pause('2026-11-13T12:05:00.000Z')])

    expect(attemptEnding(paused, at('2026-11-13T12:20:00.000Z'))).toStrictEqual({
      endReason: 'submitted',
      finishedAt: at('2026-11-13T12:20:00.000Z'),
      activeSeconds: 180,
      pauseCount: 2,
      pauseSeconds: 1020,
    })
  })

  it('lets a deadline job finish only the attempt it was scheduled for once time is up', () => {
    const deadline = at('2026-11-13T12:10:00.000Z')

    expect(deadlineJobAction(clock(), deadline, at('2026-11-13T12:10:01.000Z'))).toBe('finish')
    expect(deadlineJobAction(clock(), deadline, at('2026-11-13T12:09:58.000Z'))).toBe('retry')
    expect(
      deadlineJobAction(
        clock('in-progress', [minutePause(2)]),
        deadline,
        at('2026-11-13T12:10:01.000Z'),
      ),
    ).toBe('skip')
    expect(deadlineJobAction(clock('paused'), deadline, at('2026-11-13T12:10:01.000Z'))).toBe(
      'skip',
    )
    expect(deadlineJobAction(clock('finished'), deadline, at('2026-11-13T12:10:01.000Z'))).toBe(
      'skip',
    )
  })
})
