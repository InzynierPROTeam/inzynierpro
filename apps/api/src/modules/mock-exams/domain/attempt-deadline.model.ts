import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import { UserId } from '@inzpro/domain/modules/identity/user'
import { MockExamAttemptId } from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Schema } from 'effect'

export const AttemptDeadlineJob = Schema.Struct({
  attemptId: MockExamAttemptId,
  userId: UserId,
  qualificationPathId: QualificationPathId,
  deadline: DateTimeUtc,
})

export type AttemptDeadlineJob = typeof AttemptDeadlineJob.Type

export const finishAtDeadline = 'finish'
export const retryBeforeDeadline = 'retry'
export const skipDeadlineJob = 'skip'

export const deadlineJobActionValues = [
  finishAtDeadline,
  retryBeforeDeadline,
  skipDeadlineJob,
] as const

export const DeadlineJobAction = Schema.Literals(deadlineJobActionValues)

export type DeadlineJobAction = typeof DeadlineJobAction.Type
