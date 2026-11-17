import { Schema } from 'effect'
import { Uuid } from '~domain/common/id.js'

export const MockExamAttemptId = Uuid.pipe(Schema.brand('MockExamAttemptId'))

export type MockExamAttemptId = typeof MockExamAttemptId.Type

export const AttemptQuestionPosition = Schema.Int.check(Schema.isGreaterThan(0)).pipe(
  Schema.brand('AttemptQuestionPosition'),
)

export type AttemptQuestionPosition = typeof AttemptQuestionPosition.Type

export const inProgressAttempt = 'in-progress'
export const pausedAttempt = 'paused'
export const finishedAttempt = 'finished'
export const abandonedAttempt = 'abandoned'

export const mockExamAttemptStatusValues = [
  inProgressAttempt,
  pausedAttempt,
  finishedAttempt,
  abandonedAttempt,
] as const

export const MockExamAttemptStatus = Schema.Literals(mockExamAttemptStatusValues)

export type MockExamAttemptStatus = typeof MockExamAttemptStatus.Type

export const unfinishedAttemptStatuses = [inProgressAttempt, pausedAttempt] as const

export const AttemptQuestionVersion = Schema.Int.check(Schema.isGreaterThan(0)).pipe(
  Schema.brand('AttemptQuestionVersion'),
)

export type AttemptQuestionVersion = typeof AttemptQuestionVersion.Type

export const initialAttemptQuestionVersion = AttemptQuestionVersion.make(1)

export const nextAttemptQuestionVersion = (version: AttemptQuestionVersion) =>
  AttemptQuestionVersion.make(version + 1)

export const ExamActiveSeconds = Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)).pipe(
  Schema.brand('ExamActiveSeconds'),
)

export type ExamActiveSeconds = typeof ExamActiveSeconds.Type

export const ExamPauseCount = Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)).pipe(
  Schema.brand('ExamPauseCount'),
)

export type ExamPauseCount = typeof ExamPauseCount.Type

export const submittedAttempt = 'submitted'
export const timeExpiredAttempt = 'time-expired'

export const mockExamEndReasonValues = [submittedAttempt, timeExpiredAttempt] as const

export const MockExamEndReason = Schema.Literals(mockExamEndReasonValues)

export type MockExamEndReason = typeof MockExamEndReason.Type
