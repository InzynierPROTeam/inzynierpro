import { UtcIsoDateTime } from '@inzpro/domain/common/date-time'
import { QuestionAnswerId } from '@inzpro/domain/modules/learning-content/question-answer'
import {
  QuestionCount,
  ReferenceDocumentId,
} from '@inzpro/domain/modules/learning-content/reference-document'
import {
  QuestionRevisionId,
  WrittenQuestionId,
} from '@inzpro/domain/modules/learning-content/written-question'
import {
  ExamDurationMinutes,
  ExamSectionName,
  ExamSectionPosition,
  MockExamUnavailableReason,
} from '@inzpro/domain/modules/mock-exams/exam-blueprint'
import {
  AttemptQuestionPosition,
  MockExamAttemptId,
  MockExamAttemptStatus,
} from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Schema } from 'effect'

export const ExamSectionDocument = Schema.Struct({
  id: ReferenceDocumentId,
  title: Schema.NonEmptyString,
})

export const MockExamSectionPreview = Schema.Struct({
  position: ExamSectionPosition,
  name: ExamSectionName,
  questionCount: QuestionCount,
  // CONTRACT: Distinct published, non-withdrawn questions on the path from the section's documents.
  availableQuestionCount: QuestionCount,
  documents: Schema.Array(ExamSectionDocument),
})

export type MockExamSectionPreview = typeof MockExamSectionPreview.Type

export const MockExamBlueprintPreview = Schema.Struct({
  durationMinutes: ExamDurationMinutes,
  questionCount: QuestionCount,
  passThreshold: QuestionCount,
  sections: Schema.Array(MockExamSectionPreview),
})

export type MockExamBlueprintPreview = typeof MockExamBlueprintPreview.Type

export const MockExamAttemptSummary = Schema.Struct({
  id: MockExamAttemptId,
  status: MockExamAttemptStatus,
  startedAt: UtcIsoDateTime,
})

export type MockExamAttemptSummary = typeof MockExamAttemptSummary.Type

export const MockExamPreview = Schema.Struct({
  qualificationPathId: QualificationPathId,
  // CONTRACT: The latest version of the path's blueprint; null when the path has no blueprint.
  blueprint: Schema.NullOr(MockExamBlueprintPreview),
  unavailableReason: Schema.NullOr(MockExamUnavailableReason),
  unfinishedAttempt: Schema.NullOr(MockExamAttemptSummary),
})

export type MockExamPreview = typeof MockExamPreview.Type

export const MockExamPreviewResponse = MockExamPreview

export const AttemptAnswerOption = Schema.Struct({
  id: QuestionAnswerId,
  text: Schema.NonEmptyString,
})

export const AttemptQuestion = Schema.Struct({
  position: AttemptQuestionPosition,
  section: ExamSectionPosition,
  questionId: WrittenQuestionId,
  questionRevisionId: QuestionRevisionId,
  body: Schema.NonEmptyString,
  // CONTRACT: Options retain the attempt's stored presentation order.
  answers: Schema.Array(AttemptAnswerOption),
  isWithdrawn: Schema.Boolean,
})

export type AttemptQuestion = typeof AttemptQuestion.Type

export const AttemptSection = Schema.Struct({
  position: ExamSectionPosition,
  name: ExamSectionName,
  questionCount: QuestionCount,
})

export const MockExamAttempt = Schema.Struct({
  ...MockExamAttemptSummary.fields,
  durationMinutes: ExamDurationMinutes,
  passThreshold: QuestionCount,
  questionCount: QuestionCount,
  sections: Schema.Array(AttemptSection),
})

export type MockExamAttempt = typeof MockExamAttempt.Type

export const StartMockExamAttemptResponse = MockExamAttempt

// CONTRACT: null when the attempt does not exist on this path or belongs to another account.
export const MockExamAttemptResponse = Schema.NullOr(MockExamAttempt)

// CONTRACT: null when the attempt is not the learner's on this path or has no question at this position.
export const AttemptQuestionResponse = Schema.NullOr(AttemptQuestion)
