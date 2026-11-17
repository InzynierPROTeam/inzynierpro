import {
  ExamActiveSeconds,
  ExamPauseCount,
  inProgressAttempt,
  submittedAttempt,
  timeExpiredAttempt,
} from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import { DateTime, Duration, Option } from 'effect'
import {
  type DeadlineJobAction,
  finishAtDeadline,
  retryBeforeDeadline,
  skipDeadlineJob,
} from '~api/modules/mock-exams/domain/attempt-deadline.model.js'
import type {
  AttemptClock,
  AttemptEnding,
} from '~api/modules/mock-exams/domain/mock-exam-attempt.model.js'

const pausedTime = (clock: AttemptClock, now: DateTime.Utc) =>
  clock.pauses.reduce(
    (total, pause) =>
      Duration.sum(
        total,
        DateTime.distance(
          pause.pausedAt,
          Option.getOrElse(pause.endedAt, () => now),
        ),
      ),
    Duration.zero,
  )

const wholeSeconds = (duration: Duration.Duration) =>
  ExamActiveSeconds.make(Math.max(0, Math.floor(Duration.toSeconds(duration))))

export const attemptDeadline = (clock: AttemptClock, now: DateTime.Utc) =>
  DateTime.addDuration(
    clock.startedAt,
    Duration.sum(Duration.minutes(clock.durationMinutes), pausedTime(clock, now)),
  )

const isPastDeadline = (clock: AttemptClock, now: DateTime.Utc) =>
  !DateTime.isLessThan(now, attemptDeadline(clock, now))

export const acceptsDraftWrites = (clock: AttemptClock, now: DateTime.Utc) =>
  clock.status === inProgressAttempt && !isPastDeadline(clock, now)

export const acceptsPause = acceptsDraftWrites

export const isDueToExpire = (clock: AttemptClock, now: DateTime.Utc) =>
  clock.status === inProgressAttempt && isPastDeadline(clock, now)

export const attemptEnding = (clock: AttemptClock, now: DateTime.Utc): AttemptEnding => {
  const timeExpired = isPastDeadline(clock, now)
  const finishedAt = timeExpired ? attemptDeadline(clock, now) : now
  const paused = pausedTime(clock, finishedAt)

  return {
    endReason: timeExpired ? timeExpiredAttempt : submittedAttempt,
    finishedAt,
    activeSeconds: wholeSeconds(
      Duration.subtract(DateTime.distance(clock.startedAt, finishedAt), paused),
    ),
    pauseCount: ExamPauseCount.make(clock.pauses.length),
    pauseSeconds: wholeSeconds(paused),
  }
}

export const deadlineJobAction = (
  clock: AttemptClock,
  scheduledDeadline: DateTime.Utc,
  now: DateTime.Utc,
): DeadlineJobAction =>
  clock.status !== inProgressAttempt ||
  DateTime.isGreaterThan(attemptDeadline(clock, now), scheduledDeadline)
    ? skipDeadlineJob
    : isPastDeadline(clock, now)
      ? finishAtDeadline
      : retryBeforeDeadline
