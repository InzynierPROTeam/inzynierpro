import { UtcIsoDateTime } from '@inzpro/domain/common/date-time'
import {
  KnowledgeCheckFormat,
  OralKnowledgeCheckOptionId,
} from '@inzpro/domain/modules/learning-content/oral-knowledge-check'
import {
  OralQuestionId,
  OralRevisionId,
} from '@inzpro/domain/modules/learning-content/oral-question'
import { OralQuestionCategoryId } from '@inzpro/domain/modules/learning-content/oral-question-category'
import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { LearningXp } from '@inzpro/domain/modules/learning-xp/learning-xp'
import {
  continueStudyNextStep,
  reviewNextStep,
  SessionQuestionPosition,
  StudySessionKind,
  StudySessionStatus,
  startStudyNextStep,
} from '@inzpro/domain/modules/learning/study-session'
import {
  OralQuizCheckPosition,
  OralSessionQuizId,
} from '@inzpro/domain/modules/oral-study/oral-session-quiz'
import {
  OralQuestionScope,
  OralSelfAssessment,
  OralStudySessionId,
} from '@inzpro/domain/modules/oral-study/oral-study-session'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Schema } from 'effect'
import {
  QuestionReference,
  ResolvedRichContent,
} from '~api-contracts/modules/learning-content/responses.js'
import { LearningRewards } from '~api-contracts/modules/learning-xp/responses.js'
import {
  SessionCountSettings,
  StudySessionProgress,
  QuestionNote,
} from '~api-contracts/modules/learning/responses.js'
import { CursorPaginatedResponse } from '~api-contracts/utils/pagination.js'

export const OralQuestionCategory = Schema.Struct({
  id: OralQuestionCategoryId,
  name: Schema.NonEmptyString,
  availableQuestionCount: QuestionCount,
  // CONTRACT: completedQuestionCount measures coverage in the current oral learning round.
  completedQuestionCount: QuestionCount,
})

export type OralQuestionCategory = typeof OralQuestionCategory.Type

export const OralMaterialsResponse = CursorPaginatedResponse(OralQuestionCategory)

export const OralSessionCategory = Schema.Struct({
  id: OralQuestionCategoryId,
  name: Schema.NonEmptyString,
})

export const OralSessionPreview = Schema.Struct({
  qualificationPathId: QualificationPathId,
  questionScope: OralQuestionScope,
  category: OralQuestionCategory,
  settings: SessionCountSettings,
})

export type OralSessionPreview = typeof OralSessionPreview.Type

// CONTRACT: null means the requested category has no questions on the path in the question scope or, when categoryId is omitted, no category has any.
export const OralSessionPreviewResponse = Schema.NullOr(OralSessionPreview)

export const OralStudySession = Schema.Struct({
  id: OralStudySessionId,
  kind: StudySessionKind,
  category: Schema.NullOr(OralSessionCategory),
  status: StudySessionStatus,
  progress: StudySessionProgress,
  createdAt: UtcIsoDateTime,
  endedAt: Schema.NullOr(UtcIsoDateTime),
})

export type OralStudySession = typeof OralStudySession.Type

export const StartOralSessionResponse = OralStudySession

export const OralStudySessionResponse = Schema.NullOr(OralStudySession)

export const EndOralSessionResponse = Schema.Struct({
  session: OralStudySession,
  rewards: LearningRewards,
})

export type EndOralSessionResponse = typeof EndOralSessionResponse.Type

export const StoredOralSelfAssessment = Schema.Struct({
  value: OralSelfAssessment,
  assessedAt: UtcIsoDateTime,
})

export type StoredOralSelfAssessment = typeof StoredOralSelfAssessment.Type

export const OralSessionQuestion = Schema.Struct({
  sessionId: OralStudySessionId,
  position: SessionQuestionPosition,
  questionId: OralQuestionId,
  oralRevisionId: OralRevisionId,
  body: ResolvedRichContent,
  answer: ResolvedRichContent,
  references: Schema.Array(QuestionReference),
  note: Schema.NullOr(QuestionNote),
  isFavorite: Schema.Boolean,
  isWithdrawn: Schema.Boolean,
  selfAssessment: Schema.NullOr(StoredOralSelfAssessment),
})

export type OralSessionQuestion = typeof OralSessionQuestion.Type

export const OralSessionQuestionResponse = Schema.NullOr(OralSessionQuestion)

export const SubmitOralSelfAssessmentResponse = Schema.Struct({
  rewards: LearningRewards,
  question: OralSessionQuestion,
  session: OralStudySession,
})

export type SubmitOralSelfAssessmentResponse = typeof SubmitOralSelfAssessmentResponse.Type

export const OralSessionResult = Schema.Struct({
  earnedXp: LearningXp,
  hard: QuestionCount,
  medium: QuestionCount,
  easy: QuestionCount,
})

export type OralSessionResult = typeof OralSessionResult.Type

export const OralStudySessionSummary = Schema.Struct({
  ...OralStudySession.fields,
  result: OralSessionResult,
})

export type OralStudySessionSummary = typeof OralStudySessionSummary.Type

// CONTRACT: An unfinished oral session has a null summary.
export const OralStudySessionSummaryResponse = Schema.NullOr(OralStudySessionSummary)

export const OralSessionQuestionResult = Schema.Struct({
  position: SessionQuestionPosition,
  selfAssessment: Schema.NullOr(OralSelfAssessment),
  isWithdrawn: Schema.Boolean,
})

export type OralSessionQuestionResult = typeof OralSessionQuestionResult.Type

export const OralSessionResultsResponse = CursorPaginatedResponse(OralSessionQuestionResult)

export const OralSessionNextStep = Schema.Union([
  Schema.Struct({
    type: Schema.Literal(reviewNextStep),
    category: Schema.NullOr(OralSessionCategory),
    dueQuestionCount: QuestionCount,
  }),
  Schema.Struct({ type: Schema.Literal(continueStudyNextStep), session: OralStudySession }),
  Schema.Struct({ type: Schema.Literal(startStudyNextStep), preview: OralSessionPreview }),
])

export type OralSessionNextStep = typeof OralSessionNextStep.Type

export const OralSessionNextStepResponse = Schema.NullOr(OralSessionNextStep)

export const OralReviewPreview = Schema.Struct({
  qualificationPathId: QualificationPathId,
  questionScope: OralQuestionScope,
  category: Schema.NullOr(OralSessionCategory),
  dueQuestionCount: QuestionCount,
  nextDueAt: Schema.NullOr(UtcIsoDateTime),
  settings: Schema.NullOr(SessionCountSettings),
})

export type OralReviewPreview = typeof OralReviewPreview.Type

export const OralReviewPreviewResponse = Schema.NullOr(OralReviewPreview)

export const OralFavoritesPreview = Schema.Struct({
  qualificationPathId: QualificationPathId,
  favoriteQuestionCount: QuestionCount,
  settings: Schema.NullOr(SessionCountSettings),
})

export type OralFavoritesPreview = typeof OralFavoritesPreview.Type

export const OralFavoritesPreviewResponse = OralFavoritesPreview

export const OralFavoriteQuestion = Schema.Struct({
  questionId: OralQuestionId,
  isFavorite: Schema.Boolean,
})

export const OralQuestionNoteResult = Schema.Struct({
  questionId: OralQuestionId,
  note: Schema.NullOr(QuestionNote),
})

export type OralQuestionNoteResult = typeof OralQuestionNoteResult.Type

export const OralQuizCheckOption = Schema.Struct({
  id: OralKnowledgeCheckOptionId,
  text: Schema.NonEmptyString,
})

export const OralQuizCheckResult = Schema.Struct({
  isCorrect: Schema.Boolean,
  selectedOptionIds: Schema.Array(OralKnowledgeCheckOptionId),
  correctOptionIds: Schema.Array(OralKnowledgeCheckOptionId),
  explanation: ResolvedRichContent,
  answeredAt: UtcIsoDateTime,
})

export type OralQuizCheckResult = typeof OralQuizCheckResult.Type

export const OralQuizCheck = Schema.Struct({
  position: OralQuizCheckPosition,
  format: KnowledgeCheckFormat,
  prompt: Schema.NonEmptyString,
  options: Schema.Array(OralQuizCheckOption),
  // CONTRACT: result is null until the check is answered.
  result: Schema.NullOr(OralQuizCheckResult),
})

export type OralQuizCheck = typeof OralQuizCheck.Type

export const OralQuizChecksResponse = CursorPaginatedResponse(OralQuizCheck)

export const OralSessionQuiz = Schema.Struct({
  earnedXp: LearningXp,
  id: OralSessionQuizId,
  sessionId: OralStudySessionId,
  checkCount: QuestionCount,
  answeredCount: QuestionCount,
  isCompleted: Schema.Boolean,
})

export type OralSessionQuiz = typeof OralSessionQuiz.Type

export const OralSessionQuizState = Schema.Struct({
  quiz: Schema.NullOr(OralSessionQuiz),
  // CONTRACT: availableFormats lists the formats a new quiz could draw; it is empty while the session is unfinished and once its quiz exists.
  availableFormats: Schema.Array(KnowledgeCheckFormat),
})

export type OralSessionQuizState = typeof OralSessionQuizState.Type

// CONTRACT: null means the oral session does not belong to the learner on this path.
export const OralSessionQuizStateResponse = Schema.NullOr(OralSessionQuizState)

export const StartOralSessionQuizResponse = OralSessionQuiz

export const AnswerOralQuizCheckResponse = Schema.Struct({
  rewards: LearningRewards,
  check: OralQuizCheck,
  quiz: OralSessionQuiz,
})

export type AnswerOralQuizCheckResponse = typeof AnswerOralQuizCheckResponse.Type
