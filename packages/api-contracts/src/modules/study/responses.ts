import { UtcIsoDateTime } from '@inzpro/domain/common/date-time'
import { Percent } from '@inzpro/domain/common/percent'
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
  // Questions covered in the learner's current LearningRound.
  completedQuestionCount: QuestionCount,
})

export type DocumentQuestionPool = typeof DocumentQuestionPool.Type

export const OralQuestionCategory = Schema.Struct({
  id: OralQuestionCategoryId,
  name: Schema.NonEmptyString,
  availableQuestionCount: QuestionCount,
  // Questions covered in the learner's current oral round.
  completedQuestionCount: QuestionCount,
})

export type OralQuestionCategory = typeof OralQuestionCategory.Type

export const DocumentResponse = Schema.Struct({ document: DocumentQuestionPool })

export const DocumentsResponse = CursorPaginatedResponse(DocumentQuestionPool)

/** The backend revalidates these limits when starting the session. */
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
  // Questions uncovered in the current round; a scope covered in this round offers all of them again.
  questionSelection: SessionQuestionSelection,
  availableQuestionCount: QuestionCount,
  settings: SessionCountSettings,
})

export type SessionPreview = typeof SessionPreview.Type

export const SessionPreviewResponse = Schema.NullOr(SessionPreview)

export const ReviewPreview = Schema.Struct({
  qualificationPathId: QualificationPathId,
  // Null for reviews of the whole path.
  document: Schema.NullOr(SessionDocument),
  dueQuestionCount: QuestionCount,
  // The earliest review scheduled after now; null when none is scheduled.
  nextDueAt: Schema.NullOr(UtcIsoDateTime),
  // Null when nothing is due.
  settings: Schema.NullOr(SessionCountSettings),
})

export type ReviewPreview = typeof ReviewPreview.Type

// Null for a document that is not on the path.
export const ReviewPreviewResponse = Schema.NullOr(ReviewPreview)

export const FavoritesPreview = Schema.Struct({
  qualificationPathId: QualificationPathId,
  // Null for favourites of the whole path.
  document: Schema.NullOr(SessionDocument),
  // Marked questions in the scope whose current revision is published and not withdrawn.
  favoriteQuestionCount: QuestionCount,
  // Null when nothing is marked.
  settings: Schema.NullOr(SessionCountSettings),
})

export type FavoritesPreview = typeof FavoritesPreview.Type

// Null for a document that is not on the path.
export const FavoritesPreviewResponse = Schema.NullOr(FavoritesPreview)

/** Marks are shared across the learner's paths. */
export const FavoriteQuestion = Schema.Struct({
  questionId: WrittenQuestionId,
  isFavorite: Schema.Boolean,
})

export type FavoriteQuestion = typeof FavoriteQuestion.Type

export const FavoriteQuestionResponse = FavoriteQuestion

/** Notes are shared across the learner's paths. */
export const QuestionNote = Schema.Struct({
  text: QuestionNoteText,
  updatedAt: UtcIsoDateTime,
  // The question's current revision is substantively newer than the one current at the last edit,
  // so the note may refer to earlier wording.
  refersToEarlierWording: Schema.Boolean,
})

export type QuestionNote = typeof QuestionNote.Type

/** Null after clearing the note. */
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
  // Questions withdrawn before an answer: skipped without penalty and left out of the percent and score (ADR-0003).
  skipped: QuestionCount,
  percent: Percent,
  currentQuestion: SessionQuestionPosition,
})

export type StudySessionProgress = typeof StudySessionProgress.Type

export const StudySession = Schema.Struct({
  id: StudySessionId,
  // Only regular study is resumed from "Continue learning".
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

/** Includes regular study only. */
export const LatestStudySession = Schema.Struct({
  ...StudySession.fields,
  document: SessionDocument,
})

export type LatestStudySession = typeof LatestStudySession.Type

export const LatestStudySessionResponse = Schema.NullOr(LatestStudySession)

/** Continuing selects the most recently used unfinished regular-study session. */
export const SessionNextStep = Schema.Union([
  Schema.Struct({
    type: Schema.Literal(reviewNextStep),
    // Null for a review of the whole path.
    document: Schema.NullOr(SessionDocument),
    dueQuestionCount: QuestionCount,
  }),
  Schema.Struct({ type: Schema.Literal(continueStudyNextStep), session: LatestStudySession }),
  Schema.Struct({ type: Schema.Literal(startStudyNextStep), preview: SessionPreview }),
])

export type SessionNextStep = typeof SessionNextStep.Type

// Null when the path has nothing left to suggest.
export const SessionNextStepResponse = Schema.NullOr(SessionNextStep)

export const EndSessionResponse = StudySession

export const StudySessionResult = Schema.Struct({
  correct: QuestionCount,
  incorrect: QuestionCount,
  // Answers given after opening the explanation; they still count as correct or incorrect.
  assisted: QuestionCount,
  // The score: correct answers among the session's questions that were not skipped.
  correctPercent: Percent,
})

export type StudySessionResult = typeof StudySessionResult.Type

export const StudySessionSummary = Schema.Struct({
  ...StudySession.fields,
  // Null for a review or favourites session of the whole path.
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
  // Clients mark the correct option in feedback; the backend scores by answer ID, never a client result.
  isCorrect: Schema.Boolean,
})

export const SessionAnswer = Schema.Struct({
  answerId: QuestionAnswerId,
  isCorrect: Schema.Boolean,
  // The explanation or a saved note was opened before submitting, so the result is not independent mastery.
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
  // The session's stored presentation order.
  answers: Schema.Array(SessionAnswerOption),
  // A withdrawn revision accepts no answer, even in a started session (ADR-0003).
  isWithdrawn: Schema.Boolean,
  // When the backend recorded opening the explanation; before submitting it marks the answer assisted.
  explanationOpenedAt: Schema.NullOr(UtcIsoDateTime),
  // When the backend recorded opening a saved note; before submitting it gives the note level.
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

/** A session draws the category's questions uncovered in the current oral round first, in catalogue order. */
export const OralSessionPreview = Schema.Struct({
  qualificationPathId: QualificationPathId,
  category: OralQuestionCategory,
  settings: SessionCountSettings,
})

export type OralSessionPreview = typeof OralSessionPreview.Type

// Null when the category is not on the path or no category has questions.
export const OralSessionPreviewResponse = Schema.NullOr(OralSessionPreview)

export const OralStudySession = Schema.Struct({
  id: OralStudySessionId,
  category: OralSessionCategory,
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
  // The prepared answer; clients hide it until the learner reveals it, which is never assistance.
  answer: ResolvedRichContent,
  // A withdrawn revision accepts no self-assessment, even in a started session (ADR-0003).
  isWithdrawn: Schema.Boolean,
  // Final once stored.
  selfAssessment: Schema.NullOr(StoredOralSelfAssessment),
})

export type OralSessionQuestion = typeof OralSessionQuestion.Type

export const OralSessionQuestionResponse = Schema.NullOr(OralSessionQuestion)

export const SubmitOralSelfAssessmentResponse = Schema.Struct({
  question: OralSessionQuestion,
  session: OralStudySession,
})

export type SubmitOralSelfAssessmentResponse = typeof SubmitOralSelfAssessmentResponse.Type

/** Self-assessed questions of the session counted by level. */
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

// Only an ended session has a summary.
export const OralStudySessionSummaryResponse = Schema.NullOr(OralStudySessionSummary)

export const OralSessionQuestionResult = Schema.Struct({
  position: SessionQuestionPosition,
  selfAssessment: Schema.NullOr(OralSelfAssessment),
  isWithdrawn: Schema.Boolean,
})

export type OralSessionQuestionResult = typeof OralSessionQuestionResult.Type

export const OralSessionResultsResponse = CursorPaginatedResponse(OralSessionQuestionResult)

/** Continuing selects the most recently used unfinished oral session. */
export const OralSessionNextStep = Schema.Union([
  Schema.Struct({ type: Schema.Literal(continueStudyNextStep), session: OralStudySession }),
  Schema.Struct({ type: Schema.Literal(startStudyNextStep), preview: OralSessionPreview }),
])

export type OralSessionNextStep = typeof OralSessionNextStep.Type

// Null when the path has nothing left to suggest.
export const OralSessionNextStepResponse = Schema.NullOr(OralSessionNextStep)
