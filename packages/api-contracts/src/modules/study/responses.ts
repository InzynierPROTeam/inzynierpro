import { UtcIsoDateTime } from '@inzpro/domain/common/date-time'
import { Percent } from '@inzpro/domain/common/percent'
import {
  KnowledgeCheckFormat,
  OralKnowledgeCheckOptionId,
} from '@inzpro/domain/modules/learning-content/oral-knowledge-check'
import {
  OralQuestionId,
  OralRevisionId,
} from '@inzpro/domain/modules/learning-content/oral-question'
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
  OralQuizCheckPosition,
  OralSessionQuizId,
} from '@inzpro/domain/modules/study/oral-session-quiz'
import {
  OralQuestionScope,
  OralSelfAssessment,
  OralStudySessionId,
} from '@inzpro/domain/modules/study/oral-study-session'
import { QuestionNoteText } from '@inzpro/domain/modules/study/question-note'
import {
  continueStudyNextStep,
  reviewNextStep,
  SessionQuestionPosition,
  SessionQuestionSelection,
  StudySessionId,
  StudySessionKind,
  StudySessionStatus,
  startStudyNextStep,
} from '@inzpro/domain/modules/study/study-session'
import { Schema } from 'effect'
import { ResolvedRichContent } from '~api-contracts/modules/learning-content/responses.js'
import { CursorPaginatedResponse } from '~api-contracts/utils/pagination.js'

export const DocumentQuestionPool = Schema.Struct({
  id: ReferenceDocumentId,
  title: Schema.NonEmptyString,
  availableQuestionCount: QuestionCount,
  // CONTRACT: completedQuestionCount measures coverage in the current learning round.
  completedQuestionCount: QuestionCount,
})

export type DocumentQuestionPool = typeof DocumentQuestionPool.Type

export const OralQuestionCategory = Schema.Struct({
  id: OralQuestionCategoryId,
  name: Schema.NonEmptyString,
  availableQuestionCount: QuestionCount,
  // CONTRACT: completedQuestionCount measures coverage in the current oral learning round.
  completedQuestionCount: QuestionCount,
})

export type OralQuestionCategory = typeof OralQuestionCategory.Type

export const DocumentResponse = Schema.Struct({ document: DocumentQuestionPool })

export const DocumentsResponse = CursorPaginatedResponse(DocumentQuestionPool)

export const SessionCountSettings = Schema.Struct({
  defaultQuestionCount: QuestionCount,
  canChangeQuestionCount: Schema.Boolean,
  minimumQuestionCount: QuestionCount,
  maximumQuestionCount: QuestionCount,
})

export type SessionCountSettings = typeof SessionCountSettings.Type

export const SessionDocument = Schema.Struct({
  id: ReferenceDocumentId,
  title: Schema.NonEmptyString,
})

export const SessionPreview = Schema.Struct({
  qualificationPathId: QualificationPathId,
  document: DocumentQuestionPool,
  mode: Schema.Literal('written-study'),
  questionSelection: SessionQuestionSelection,
  availableQuestionCount: QuestionCount,
  settings: SessionCountSettings,
})

export type SessionPreview = typeof SessionPreview.Type

export const SessionPreviewResponse = Schema.NullOr(SessionPreview)

export const ReviewPreview = Schema.Struct({
  qualificationPathId: QualificationPathId,
  // CONTRACT: A null document means reviews span the whole path.
  document: Schema.NullOr(SessionDocument),
  dueQuestionCount: QuestionCount,
  // CONTRACT: The earliest review scheduled after now; null when none is scheduled.
  nextDueAt: Schema.NullOr(UtcIsoDateTime),
  // CONTRACT: settings is null when no question is due.
  settings: Schema.NullOr(SessionCountSettings),
})

export type ReviewPreview = typeof ReviewPreview.Type

// CONTRACT: null means the requested document is outside the path.
export const ReviewPreviewResponse = Schema.NullOr(ReviewPreview)

export const FavoritesPreview = Schema.Struct({
  qualificationPathId: QualificationPathId,
  // CONTRACT: A null document means favourites span the whole path.
  document: Schema.NullOr(SessionDocument),
  favoriteQuestionCount: QuestionCount,
  // CONTRACT: settings is null when no eligible favourite question is available in this scope.
  settings: Schema.NullOr(SessionCountSettings),
})

export type FavoritesPreview = typeof FavoritesPreview.Type

// CONTRACT: null means the requested document is outside the path.
export const FavoritesPreviewResponse = Schema.NullOr(FavoritesPreview)

export const FavoriteQuestion = Schema.Struct({
  questionId: WrittenQuestionId,
  isFavorite: Schema.Boolean,
})

export type FavoriteQuestion = typeof FavoriteQuestion.Type

export const FavoriteQuestionResponse = FavoriteQuestion

export const QuestionNote = Schema.Struct({
  text: QuestionNoteText,
  updatedAt: UtcIsoDateTime,
  // CONTRACT: Compares substantive content with the revision current at the last note edit.
  refersToEarlierWording: Schema.Boolean,
})

export type QuestionNote = typeof QuestionNote.Type

export const QuestionNoteResult = Schema.Struct({
  questionId: WrittenQuestionId,
  note: Schema.NullOr(QuestionNote),
})

export type QuestionNoteResult = typeof QuestionNoteResult.Type

export const QuestionNoteResponse = QuestionNoteResult

export const OralMaterialsResponse = CursorPaginatedResponse(OralQuestionCategory)

export const StudySessionProgress = Schema.Struct({
  total: QuestionCount,
  answered: QuestionCount,
  skipped: QuestionCount,
  percent: Percent,
  currentQuestion: SessionQuestionPosition,
})

export type StudySessionProgress = typeof StudySessionProgress.Type

export const StudySession = Schema.Struct({
  id: StudySessionId,
  kind: StudySessionKind,
  status: StudySessionStatus,
  progress: StudySessionProgress,
  createdAt: UtcIsoDateTime,
  endedAt: Schema.NullOr(UtcIsoDateTime),
})

export type StudySession = typeof StudySession.Type

export const StartSessionResponse = StudySession

export const StartReviewSessionResponse = StudySession

export const StartFavoritesSessionResponse = StudySession

export const StudySessionResponse = Schema.NullOr(StudySession)

// CONTRACT: Contains regular-study sessions only.
export const LatestStudySession = Schema.Struct({
  ...StudySession.fields,
  document: SessionDocument,
})

export type LatestStudySession = typeof LatestStudySession.Type

export const LatestStudySessionResponse = Schema.NullOr(LatestStudySession)

export const SessionNextStep = Schema.Union([
  Schema.Struct({
    type: Schema.Literal(reviewNextStep),
    // CONTRACT: A null document means the review spans the whole path.
    document: Schema.NullOr(SessionDocument),
    dueQuestionCount: QuestionCount,
  }),
  Schema.Struct({ type: Schema.Literal(continueStudyNextStep), session: LatestStudySession }),
  Schema.Struct({ type: Schema.Literal(startStudyNextStep), preview: SessionPreview }),
])

export type SessionNextStep = typeof SessionNextStep.Type

export const SessionNextStepResponse = Schema.NullOr(SessionNextStep)

export const EndSessionResponse = StudySession

export const StudySessionResult = Schema.Struct({
  correct: QuestionCount,
  incorrect: QuestionCount,
  // CONTRACT: Assisted counts overlap the correct and incorrect counts.
  assisted: QuestionCount,
  // CONTRACT: Percentage of correct answers among questions that were not skipped.
  correctPercent: Percent,
})

export type StudySessionResult = typeof StudySessionResult.Type

export const StudySessionSummary = Schema.Struct({
  ...StudySession.fields,
  // CONTRACT: A null document means the review or favourites session spans the whole path.
  document: Schema.NullOr(SessionDocument),
  result: StudySessionResult,
})

export type StudySessionSummary = typeof StudySessionSummary.Type

export const StudySessionSummaryResponse = Schema.NullOr(StudySessionSummary)

export const SessionQuestionResult = Schema.Struct({
  position: SessionQuestionPosition,
  answer: Schema.NullOr(Schema.Struct({ isCorrect: Schema.Boolean, isAssisted: Schema.Boolean })),
  isWithdrawn: Schema.Boolean,
})

export type SessionQuestionResult = typeof SessionQuestionResult.Type

export const SessionResultsResponse = CursorPaginatedResponse(SessionQuestionResult)

export const SessionAnswerOption = Schema.Struct({
  id: QuestionAnswerId,
  text: Schema.NonEmptyString,
  isCorrect: Schema.Boolean,
})

export const SessionAnswer = Schema.Struct({
  answerId: QuestionAnswerId,
  isCorrect: Schema.Boolean,
  isAssisted: Schema.Boolean,
  answeredAt: UtcIsoDateTime,
})

export type SessionAnswer = typeof SessionAnswer.Type

export const SessionQuestion = Schema.Struct({
  sessionId: StudySessionId,
  position: SessionQuestionPosition,
  questionId: WrittenQuestionId,
  questionRevisionId: QuestionRevisionId,
  body: Schema.NonEmptyString,
  explanation: ResolvedRichContent,
  // CONTRACT: Options retain the session's stored presentation order.
  answers: Schema.Array(SessionAnswerOption),
  isWithdrawn: Schema.Boolean,
  explanationOpenedAt: Schema.NullOr(UtcIsoDateTime),
  noteOpenedAt: Schema.NullOr(UtcIsoDateTime),
  answer: Schema.NullOr(SessionAnswer),
  isFavorite: Schema.Boolean,
  note: Schema.NullOr(QuestionNote),
})

export type SessionQuestion = typeof SessionQuestion.Type

export const SessionQuestionResponse = Schema.NullOr(SessionQuestion)

export const SubmitSessionAnswerResponse = Schema.Struct({
  question: SessionQuestion,
  session: StudySession,
})

export type SubmitSessionAnswerResponse = typeof SubmitSessionAnswerResponse.Type

export const RecordSessionAssistanceResponse = SessionQuestion

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

export const EndOralSessionResponse = OralStudySession

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
  note: Schema.NullOr(QuestionNote),
  isFavorite: Schema.Boolean,
  isWithdrawn: Schema.Boolean,
  selfAssessment: Schema.NullOr(StoredOralSelfAssessment),
})

export type OralSessionQuestion = typeof OralSessionQuestion.Type

export const OralSessionQuestionResponse = Schema.NullOr(OralSessionQuestion)

export const SubmitOralSelfAssessmentResponse = Schema.Struct({
  question: OralSessionQuestion,
  session: OralStudySession,
})

export type SubmitOralSelfAssessmentResponse = typeof SubmitOralSelfAssessmentResponse.Type

export const OralSessionResult = Schema.Struct({
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
  check: OralQuizCheck,
  quiz: OralSessionQuiz,
})

export type AnswerOralQuizCheckResponse = typeof AnswerOralQuizCheckResponse.Type
