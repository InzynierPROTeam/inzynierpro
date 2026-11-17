import { QuestionAnswerId } from '@inzpro/domain/modules/learning-content/question-answer'
import {
  AttemptQuestionPosition,
  AttemptQuestionVersion,
  MockExamAttemptId,
} from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Schema } from 'effect'
import { CursorPagination } from '~api-contracts/utils/pagination.js'

export const MockExamPathParams = Schema.Struct({ qualificationPathId: QualificationPathId })

export const MockExamAttemptParams = Schema.Struct({
  qualificationPathId: QualificationPathId,
  attemptId: MockExamAttemptId,
})

export const AttemptQuestionParams = Schema.Struct({
  qualificationPathId: QualificationPathId,
  attemptId: MockExamAttemptId,
  position: Schema.FiniteFromString.pipe(Schema.decodeTo(AttemptQuestionPosition)),
})

export const SaveAttemptAnswerPayload = Schema.Struct({
  answerId: QuestionAnswerId,
  expectedVersion: AttemptQuestionVersion,
})

export type SaveAttemptAnswerPayload = typeof SaveAttemptAnswerPayload.Type

export const FlagAttemptQuestionPayload = Schema.Struct({
  isFlagged: Schema.Boolean,
  expectedVersion: AttemptQuestionVersion,
})

export type FlagAttemptQuestionPayload = typeof FlagAttemptQuestionPayload.Type

export const MockExamPageQuery = CursorPagination
