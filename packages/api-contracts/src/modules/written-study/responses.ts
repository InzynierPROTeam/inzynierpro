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
import { LearningXp } from '@inzpro/domain/modules/learning-xp/learning-xp'
import {
  continueStudyNextStep,
  reviewNextStep,
  SessionQuestionPosition,
  SessionQuestionSelection,
  StudySessionId,
  StudySessionKind,
  StudySessionStatus,
  startStudyNextStep,
} from '@inzpro/domain/modules/learning/study-session'
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

export const DocumentQuestionPool = Schema.Struct({
  id: ReferenceDocumentId,
  title: Schema.NonEmptyString,
  availableQuestionCount: QuestionCount,
  // CONTRACT: completedQuestionCount measures coverage in the current learning round.
  completedQuestionCount: QuestionCount,
})

export type DocumentQuestionPool = typeof DocumentQuestionPool.Type

export const DocumentResponse = Schema.Struct({ document: DocumentQuestionPool })

export const DocumentsResponse = CursorPaginatedResponse(DocumentQuestionPool)

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

export const QuestionNoteResult = Schema.Struct({
  questionId: WrittenQuestionId,
  note: Schema.NullOr(QuestionNote),
})

export type QuestionNoteResult = typeof QuestionNoteResult.Type

export const QuestionNoteResponse = QuestionNoteResult

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

export const EndSessionResponse = Schema.Struct({ session: StudySession, rewards: LearningRewards })

export type EndSessionResponse = typeof EndSessionResponse.Type

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
  references: Schema.Array(QuestionReference),
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

export const QuestionDetails = Schema.Struct({
  questionId: WrittenQuestionId,
  questionRevisionId: QuestionRevisionId,
  body: Schema.NonEmptyString,
  answers: Schema.Array(SessionAnswerOption),
  explanation: ResolvedRichContent,
  references: Schema.Array(QuestionReference),
  isFavorite: Schema.Boolean,
  note: Schema.NullOr(QuestionNote),
})

export type QuestionDetails = typeof QuestionDetails.Type

export const QuestionDetailsResponse = QuestionDetails

export const SubmitSessionAnswerResponse = Schema.Struct({
  awardedXp: LearningXp,
  rewards: LearningRewards,
  question: SessionQuestion,
  session: StudySession,
})

export type SubmitSessionAnswerResponse = typeof SubmitSessionAnswerResponse.Type

export const RecordSessionAssistanceResponse = SessionQuestion
