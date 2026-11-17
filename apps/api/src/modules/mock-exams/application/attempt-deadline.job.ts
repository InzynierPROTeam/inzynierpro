import { Context, DateTime, Effect, Layer, Option } from 'effect'
import { makeJobQueue } from '~api/lib/job-queue.js'
import { Transaction } from '~api/lib/transaction.js'
import {
  endLockedAttempt,
  lockAttemptForEnding,
} from '~api/modules/mock-exams/application/attempt-ending.service.js'
import { MockExamWriteError } from '~api/modules/mock-exams/application/errors.js'
import {
  AttemptDeadlineJob,
  finishAtDeadline,
  retryBeforeDeadline,
} from '~api/modules/mock-exams/domain/attempt-deadline.model.js'
import { AttemptDeadlineNotReached } from '~api/modules/mock-exams/domain/errors.js'
import { deadlineJobAction } from '~api/modules/mock-exams/domain/mock-exam-clock.rules.js'

const makeAttemptDeadlineQueue = makeJobQueue({
  name: 'mock-exam-attempt-deadlines',
  schema: AttemptDeadlineJob,
  maxAttempts: 10,
})

export class AttemptDeadlineQueue extends Context.Service<
  AttemptDeadlineQueue,
  Effect.Success<typeof makeAttemptDeadlineQueue>
>()('api/modules/mock-exams/AttemptDeadlineQueue') {}

export const AttemptDeadlineQueueLive = Layer.effect(AttemptDeadlineQueue, makeAttemptDeadlineQueue)

export const scheduleAttemptDeadline = Effect.fn('MockExams.scheduleAttemptDeadline')(function* (
  job: AttemptDeadlineJob,
) {
  const attemptDeadlineQueue = yield* AttemptDeadlineQueue
  const now = yield* DateTime.now

  yield* attemptDeadlineQueue
    .offer(job, { delay: DateTime.distance(now, job.deadline) })
    .pipe(Effect.mapError(cause => new MockExamWriteError({ cause })))
})

export const finishAttemptAtDeadline = Effect.fn('MockExams.finishAttemptAtDeadline')(function* (
  job: AttemptDeadlineJob,
) {
  const transaction = yield* Transaction

  yield* transaction.run(
    Effect.gen(function* () {
      const clock = yield* lockAttemptForEnding(job.userId, job.qualificationPathId, job.attemptId)

      if (Option.isNone(clock)) {
        return
      }

      const now = yield* DateTime.now
      const action = deadlineJobAction(clock.value, job.deadline, now)

      if (action === retryBeforeDeadline) {
        return yield* new AttemptDeadlineNotReached()
      }

      if (action === finishAtDeadline) {
        yield* endLockedAttempt(
          job.userId,
          job.qualificationPathId,
          job.attemptId,
          clock.value,
          now,
        )
      }
    }),
  )
})

export const processAttemptDeadlines = Effect.gen(function* () {
  const attemptDeadlineQueue = yield* AttemptDeadlineQueue

  return yield* attemptDeadlineQueue.process(finishAttemptAtDeadline)
})
