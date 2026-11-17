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
