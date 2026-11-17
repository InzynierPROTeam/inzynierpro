import {
  AttemptQuestionPosition,
  MockExamAttemptId,
} from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Schema } from 'effect'

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
