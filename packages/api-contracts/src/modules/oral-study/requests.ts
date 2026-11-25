import {
  KnowledgeCheckFormat,
  OralKnowledgeCheckOptionId,
} from '@inzpro/domain/modules/learning-content/oral-knowledge-check'
import { OralQuestionId } from '@inzpro/domain/modules/learning-content/oral-question'
import { OralRevisionId } from '@inzpro/domain/modules/learning-content/oral-question'
import { OralQuestionCategoryId } from '@inzpro/domain/modules/learning-content/oral-question-category'
import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { SessionQuestionPosition } from '@inzpro/domain/modules/learning/study-session'
import { OralQuizCheckPosition } from '@inzpro/domain/modules/oral-study/oral-session-quiz'
import {
  OralQuestionScope,
  OralSelfAssessment,
  OralStudySessionId,
} from '@inzpro/domain/modules/oral-study/oral-study-session'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Schema } from 'effect'
import { CursorPagination } from '~api-contracts/utils/pagination.js'

export const OralMaterialsQuery = CursorPagination

export const OralPathParams = Schema.Struct({ qualificationPathId: QualificationPathId })

export const OralSessionPreviewQuery = Schema.Struct({
  categoryId: Schema.optional(OralQuestionCategoryId),
  // CONTRACT: fromCategoryId is a continuation hint used only when categoryId is omitted.
  fromCategoryId: Schema.optional(OralQuestionCategoryId),
  // CONTRACT: Omitting questionScope means 'path'.
  questionScope: Schema.optional(OralQuestionScope),
})

export const StartOralSessionPayload = Schema.Struct({
  categoryId: OralQuestionCategoryId,
  questionCount: QuestionCount,
  // CONTRACT: Omitting questionScope means 'path'.
  questionScope: Schema.optional(OralQuestionScope),
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

export const OralReviewPreviewQuery = Schema.Struct({
  categoryId: Schema.optional(OralQuestionCategoryId),
  // CONTRACT: Omitting questionScope means 'path'.
  questionScope: Schema.optional(OralQuestionScope),
})

export const StartOralReviewSessionPayload = Schema.Struct({
  categoryId: Schema.optional(OralQuestionCategoryId),
  questionCount: QuestionCount,
  // CONTRACT: Omitting questionScope means 'path'.
  questionScope: Schema.optional(OralQuestionScope),
})

export const StartOralFavoritesSessionPayload = Schema.Struct({ questionCount: QuestionCount })

export const OralFavoriteQuestionParams = Schema.Struct({
  qualificationPathId: QualificationPathId,
  questionId: OralQuestionId,
})

export const OralQuestionDetailsParams = Schema.Struct({
  qualificationPathId: QualificationPathId,
  questionId: OralQuestionId,
})

export const StartOralSessionQuizPayload = Schema.Struct({
  formats: Schema.NonEmptyArray(KnowledgeCheckFormat),
})

export const OralQuizChecksQuery = CursorPagination

export const OralQuizCheckParams = Schema.Struct({
  qualificationPathId: QualificationPathId,
  sessionId: OralStudySessionId,
  position: Schema.FiniteFromString.pipe(Schema.decodeTo(OralQuizCheckPosition)),
})

export const AnswerOralQuizCheckPayload = Schema.Struct({
  optionIds: Schema.Array(OralKnowledgeCheckOptionId),
})

export type AnswerOralQuizCheckPayload = typeof AnswerOralQuizCheckPayload.Type
