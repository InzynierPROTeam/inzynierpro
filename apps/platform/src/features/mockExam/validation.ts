import {
  AttemptQuestionPosition,
  MockExamAttemptId,
} from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import { Schema } from 'effect'

export const AttemptQuestionRouteParams = Schema.Struct({
  attemptId: MockExamAttemptId,
  questionNumber: Schema.FiniteFromString.pipe(Schema.decodeTo(AttemptQuestionPosition)),
})
