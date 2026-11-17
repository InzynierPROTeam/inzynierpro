import { UtcIsoDateTime } from '@inzpro/domain/common/date-time'
import { Percent } from '@inzpro/domain/common/percent'
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
  ExamActiveSeconds,
  ExamPauseCount,
} from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import {
  AttemptQuestionPosition,
  AttemptQuestionVersion,
  MockExamAttemptId,
  MockExamAttemptStatus,
  MockExamEndReason,
} from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Schema } from 'effect'
import { ResolvedRichContent } from '~api-contracts/modules/learning-content/responses.js'
import { QuestionNote } from '~api-contracts/modules/learning/responses.js'
import { CursorPaginatedResponse } from '~api-contracts/utils/pagination.js'

export const ExamSectionDocument = Schema.Struct({
  id: ReferenceDocumentId,
  title: Schema.NonEmptyString,
})

export const MockExamSectionPreview = Schema.Struct({
  position: ExamSectionPosition,
  name: ExamSectionName,
  questionCount: QuestionCount,
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

export const AttemptSectionResult = Schema.Struct({
  position: ExamSectionPosition,
  name: ExamSectionName,
  questionCount: QuestionCount,
  correct: QuestionCount,
})

export const MockExamResult = Schema.Struct({
  correct: QuestionCount,
  incorrect: QuestionCount,
  unanswered: QuestionCount,
  percent: Percent,
  passed: Schema.NullOr(Schema.Boolean),
  activeSeconds: ExamActiveSeconds,
  pauseCount: ExamPauseCount,
  pauseSeconds: ExamActiveSeconds,
  sections: Schema.Array(AttemptSectionResult),
})

export type MockExamResult = typeof MockExamResult.Type

export const MockExamAttemptSummary = Schema.Struct({
  id: MockExamAttemptId,
  status: MockExamAttemptStatus,
  startedAt: UtcIsoDateTime,
  finishedAt: Schema.NullOr(UtcIsoDateTime),
  endReason: Schema.NullOr(MockExamEndReason),
  result: Schema.NullOr(MockExamResult),
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
  answers: Schema.Array(AttemptAnswerOption),
  isWithdrawn: Schema.Boolean,
  selectedAnswerId: Schema.NullOr(QuestionAnswerId),
  isFlagged: Schema.Boolean,
  version: AttemptQuestionVersion,
})

export type AttemptQuestion = typeof AttemptQuestion.Type

export const AttemptSection = Schema.Struct({
  position: ExamSectionPosition,
  name: ExamSectionName,
  questionCount: QuestionCount,
})

export const AttemptQuestionState = Schema.Struct({
  position: AttemptQuestionPosition,
  isAnswered: Schema.Boolean,
  isFlagged: Schema.Boolean,
})

export type AttemptQuestionState = typeof AttemptQuestionState.Type

export const MockExamAttempt = Schema.Struct({
  ...MockExamAttemptSummary.fields,
  deadline: UtcIsoDateTime,
  // CONTRACT: The backend time when the response was produced; clients count down from deadline minus serverTime.
  serverTime: UtcIsoDateTime,
  durationMinutes: ExamDurationMinutes,
  passThreshold: QuestionCount,
  questionCount: QuestionCount,
  sections: Schema.Array(AttemptSection),
  questions: Schema.Array(AttemptQuestionState),
})

export type MockExamAttempt = typeof MockExamAttempt.Type

export const StartMockExamAttemptResponse = MockExamAttempt

// CONTRACT: null when the attempt does not exist on this path or belongs to another account.
export const MockExamAttemptResponse = Schema.NullOr(MockExamAttempt)

// CONTRACT: null when the attempt is not the learner's on this path or has no question at this position.
export const AttemptQuestionResponse = Schema.NullOr(AttemptQuestion)

export const SaveAttemptAnswerResponse = AttemptQuestion

export const FlagAttemptQuestionResponse = AttemptQuestion

export const AttemptReviewQuestion = Schema.Struct({
  ...AttemptQuestion.fields,
  correctAnswerId: QuestionAnswerId,
  explanation: ResolvedRichContent,
  isFavorite: Schema.Boolean,
  note: Schema.NullOr(QuestionNote),
})

export type AttemptReviewQuestion = typeof AttemptReviewQuestion.Type

export const AttemptReviewResponse = CursorPaginatedResponse(AttemptReviewQuestion)
export const MockExamHistoryResponse = CursorPaginatedResponse(MockExamAttemptSummary)
