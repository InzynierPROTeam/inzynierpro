import { OralRevisionId } from '@inzpro/domain/modules/learning-content/oral-question'
import { OralQuestionCategoryId } from '@inzpro/domain/modules/learning-content/oral-question-category'
import { QuestionAnswerId } from '@inzpro/domain/modules/learning-content/question-answer'
import {
  QuestionCount,
  ReferenceDocumentId,
} from '@inzpro/domain/modules/learning-content/reference-document'
import {
  QuestionRevisionId,
  WrittenQuestionId,
} from '@inzpro/domain/modules/learning-content/written-question'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import {
  OralSelfAssessment,
  OralStudySessionId,
} from '@inzpro/domain/modules/study/oral-study-session'
import { QuestionNoteText } from '@inzpro/domain/modules/study/question-note'
import {
  SessionAssistanceKind,
  SessionQuestionPosition,
  SessionQuestionSelection,
  StudySessionId,
} from '@inzpro/domain/modules/study/study-session'
import { Schema } from 'effect'
import { CursorPagination } from '~api-contracts/utils/pagination.js'

export const GetDocumentsParams = Schema.Struct({ qualificationPathId: QualificationPathId })

export const GetDocumentParams = Schema.Struct({
  qualificationPathId: QualificationPathId,
  documentId: ReferenceDocumentId,
})

export const DocumentsQuery = CursorPagination
export const OralMaterialsQuery = CursorPagination
export const SessionResultsQuery = CursorPagination

export const SessionPreviewQuery = Schema.Struct({
  documentId: Schema.optional(ReferenceDocumentId),
  // CONTRACT: fromDocumentId is a continuation hint used only when documentId is omitted.
  fromDocumentId: Schema.optional(ReferenceDocumentId),
})

export const StartSessionPayload = Schema.Struct({
  documentId: ReferenceDocumentId,
  questionCount: QuestionCount,
  // CONTRACT: Echo questionSelection from the confirmed preview.
  questionSelection: SessionQuestionSelection,
})

export type StartSessionPayload = typeof StartSessionPayload.Type

// CONTRACT: Omitting documentId selects reviews across the whole path.
export const ReviewScopeQuery = Schema.Struct({ documentId: Schema.optional(ReferenceDocumentId) })

export const StartReviewSessionPayload = Schema.Struct({
  documentId: Schema.optional(ReferenceDocumentId),
  questionCount: QuestionCount,
})

export type StartReviewSessionPayload = typeof StartReviewSessionPayload.Type

// CONTRACT: Omitting documentId selects favourites across the whole path.
export const FavoritesScopeQuery = Schema.Struct({
  documentId: Schema.optional(ReferenceDocumentId),
})

export const StartFavoritesSessionPayload = Schema.Struct({
  documentId: Schema.optional(ReferenceDocumentId),
  questionCount: QuestionCount,
})

export type StartFavoritesSessionPayload = typeof StartFavoritesSessionPayload.Type

export const FavoriteQuestionParams = Schema.Struct({
  qualificationPathId: QualificationPathId,
  questionId: WrittenQuestionId,
})

export const QuestionNoteParams = Schema.Struct({
  qualificationPathId: QualificationPathId,
  questionId: WrittenQuestionId,
})

export const SaveQuestionNotePayload = Schema.Struct({ text: QuestionNoteText })

export type SaveQuestionNotePayload = typeof SaveQuestionNotePayload.Type

export const LatestSessionQuery = Schema.Struct({
  // CONTRACT: Omitting documentId returns the latest regular-study session across the whole path.
  documentId: Schema.optional(ReferenceDocumentId),
})

export const SessionParams = Schema.Struct({
  qualificationPathId: QualificationPathId,
  sessionId: StudySessionId,
})

export const SessionQuestionParams = Schema.Struct({
  qualificationPathId: QualificationPathId,
  sessionId: StudySessionId,
  position: Schema.FiniteFromString.pipe(Schema.decodeTo(SessionQuestionPosition)),
})

export const SubmitSessionAnswerPayload = Schema.Struct({
  questionRevisionId: QuestionRevisionId,
  answerId: QuestionAnswerId,
})

export type SubmitSessionAnswerPayload = typeof SubmitSessionAnswerPayload.Type

export const RecordSessionAssistancePayload = Schema.Struct({ kind: SessionAssistanceKind })

export type RecordSessionAssistancePayload = typeof RecordSessionAssistancePayload.Type

export const OralPathParams = Schema.Struct({ qualificationPathId: QualificationPathId })

export const OralSessionPreviewQuery = Schema.Struct({
  categoryId: Schema.optional(OralQuestionCategoryId),
  // CONTRACT: fromCategoryId is a continuation hint used only when categoryId is omitted.
  fromCategoryId: Schema.optional(OralQuestionCategoryId),
})

export const StartOralSessionPayload = Schema.Struct({
  categoryId: OralQuestionCategoryId,
  questionCount: QuestionCount,
})

export type StartOralSessionPayload = typeof StartOralSessionPayload.Type

export const LatestOralSessionQuery = Schema.Struct({
  // CONTRACT: Omitting categoryId returns the latest regular-study oral session across the whole path.
  categoryId: Schema.optional(OralQuestionCategoryId),
})

export const OralSessionParams = Schema.Struct({
  qualificationPathId: QualificationPathId,
  sessionId: OralStudySessionId,
})

export const OralSessionQuestionParams = Schema.Struct({
  qualificationPathId: QualificationPathId,
  sessionId: OralStudySessionId,
  position: Schema.FiniteFromString.pipe(Schema.decodeTo(SessionQuestionPosition)),
})

export const OralSessionResultsQuery = CursorPagination

export const SubmitOralSelfAssessmentPayload = Schema.Struct({
  oralRevisionId: OralRevisionId,
  selfAssessment: OralSelfAssessment,
})

export type SubmitOralSelfAssessmentPayload = typeof SubmitOralSelfAssessmentPayload.Type

export const OralReviewScopeQuery = Schema.Struct({
  categoryId: Schema.optional(OralQuestionCategoryId),
})

export const StartOralReviewSessionPayload = Schema.Struct({
  categoryId: Schema.optional(OralQuestionCategoryId),
  questionCount: QuestionCount,
})
