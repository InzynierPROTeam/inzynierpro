import {
  ExamActiveSeconds,
  inProgressAttempt,
  submittedAttempt,
  timeExpiredAttempt,
} from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import { DateTime, Duration } from 'effect'
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

export const attemptDeadline = (clock: AttemptClock) =>
  DateTime.addDuration(
    clock.startedAt,
    Duration.sum(Duration.minutes(clock.durationMinutes), Duration.seconds(clock.pauseSeconds)),
  )

const isPastDeadline = (clock: AttemptClock, now: DateTime.Utc) =>
  !DateTime.isLessThan(now, attemptDeadline(clock))

export const acceptsDraftWrites = (clock: AttemptClock, now: DateTime.Utc) =>
  clock.status === inProgressAttempt && !isPastDeadline(clock, now)

export const isDueToExpire = (clock: AttemptClock, now: DateTime.Utc) =>
  clock.status === inProgressAttempt && isPastDeadline(clock, now)

export const attemptEnding = (clock: AttemptClock, now: DateTime.Utc): AttemptEnding => {
  const deadline = attemptDeadline(clock)
  const timeExpired = isPastDeadline(clock, now)
  const finishedAt = timeExpired ? deadline : now

  const elapsed = Duration.subtract(
    DateTime.distance(clock.startedAt, finishedAt),
    Duration.seconds(clock.pauseSeconds),
  )

  return {
    endReason: timeExpired ? timeExpiredAttempt : submittedAttempt,
    finishedAt,
    activeSeconds: ExamActiveSeconds.make(Math.max(0, Math.floor(Duration.toSeconds(elapsed)))),
  }
}

export const deadlineJobAction = (
  clock: AttemptClock,
  scheduledDeadline: DateTime.Utc,
  now: DateTime.Utc,
): DeadlineJobAction =>
  clock.status !== inProgressAttempt ||
  DateTime.isGreaterThan(attemptDeadline(clock), scheduledDeadline)
    ? skipDeadlineJob
    : isPastDeadline(clock, now)
      ? finishAtDeadline
      : retryBeforeDeadline
