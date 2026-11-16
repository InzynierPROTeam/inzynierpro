import { UtcIsoDateTime } from '@inzpro/domain/common/date-time'
import { Percent } from '@inzpro/domain/common/percent'
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
})

export type OralQuestionCategory = typeof OralQuestionCategory.Type

export const DocumentResponse = Schema.Struct({ document: DocumentQuestionPool })

export const DocumentsResponse = CursorPaginatedResponse(DocumentQuestionPool)

/** The question counts a new session may hold; the backend validates the choice again on start. */
export const SessionCountSettings = Schema.Struct({
  defaultQuestionCount: QuestionCount,
  canChangeQuestionCount: Schema.Boolean,
  minimumQuestionCount: QuestionCount,
  maximumQuestionCount: QuestionCount,
})

export type SessionCountSettings = typeof SessionCountSettings.Type

/** The material a session covers. */
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
  // The questions the selection draws from.
  availableQuestionCount: QuestionCount,
  settings: SessionCountSettings,
})

export type SessionPreview = typeof SessionPreview.Type

export const SessionPreviewResponse = Schema.NullOr(SessionPreview)

/** The questions due for review in a scope; with nothing due no review session can start. */
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

export const OralMaterialsResponse = CursorPaginatedResponse(OralQuestionCategory)

/** How far a session got: what the progress bar and the continue link need. */
export const StudySessionProgress = Schema.Struct({
  total: QuestionCount,
  answered: QuestionCount,
  // Questions withdrawn before an answer: skipped without penalty and left out of the percent and score (ADR-0003).
  skipped: QuestionCount,
  percent: Percent,
  // The question to continue from.
  currentQuestion: SessionQuestionPosition,
})

export type StudySessionProgress = typeof StudySessionProgress.Type

export const StudySession = Schema.Struct({
  id: StudySessionId,
  // Regular study or a review session; only regular study is continued from "Continue learning".
  kind: StudySessionKind,
  status: StudySessionStatus,
  progress: StudySessionProgress,
  createdAt: UtcIsoDateTime,
  endedAt: Schema.NullOr(UtcIsoDateTime),
})

export type StudySession = typeof StudySession.Type

export const StartSessionResponse = StudySession

export const StartReviewSessionResponse = StudySession

export const StudySessionResponse = Schema.NullOr(StudySession)

/** The most recent regular-study session with its document, for continue tiles outside the session. */
export const LatestStudySession = Schema.Struct({
  ...StudySession.fields,
  document: SessionDocument,
})

export type LatestStudySession = typeof LatestStudySession.Type

export const LatestStudySessionResponse = Schema.NullOr(LatestStudySession)

/**
 * The one step a finished session suggests next: a review of due questions, continuing the most
 * recently used unfinished regular-study session, or starting the next one. Null when the path has
 * nothing left to suggest.
 */
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

export const SessionNextStepResponse = Schema.NullOr(SessionNextStep)

export const EndSessionResponse = StudySession

/** How the session went, over the questions it answered. */
export const StudySessionResult = Schema.Struct({
  correct: QuestionCount,
  incorrect: QuestionCount,
  // Answers given after opening the explanation; they still count as correct or incorrect.
  assisted: QuestionCount,
  // The score: correct answers among the session's questions that were not skipped.
  correctPercent: Percent,
})

export type StudySessionResult = typeof StudySessionResult.Type

/** A session with its material and result, for the summary after it ends. */
export const StudySessionSummary = Schema.Struct({
  ...StudySession.fields,
  // Null for a review session of the whole path.
  document: Schema.NullOr(SessionDocument),
  result: StudySessionResult,
})

export type StudySessionSummary = typeof StudySessionSummary.Type

export const StudySessionSummaryResponse = Schema.NullOr(StudySessionSummary)

/** One question of a session in the summary details: its result, or why it has none. */
export const SessionQuestionResult = Schema.Struct({
  position: SessionQuestionPosition,
  answer: Schema.NullOr(Schema.Struct({ isCorrect: Schema.Boolean, isAssisted: Schema.Boolean })),
  isWithdrawn: Schema.Boolean,
})

export type SessionQuestionResult = typeof SessionQuestionResult.Type

export const SessionResultsResponse = CursorPaginatedResponse(SessionQuestionResult)

/** One option of a session question in the session's stored order. */
export const SessionAnswerOption = Schema.Struct({
  id: QuestionAnswerId,
  text: Schema.NonEmptyString,
  // Clients mark the correct option in feedback; the backend scores by answer ID, never a client result.
  isCorrect: Schema.Boolean,
})

/** The learner's single submitted answer to a session question, scored by the backend. */
export const SessionAnswer = Schema.Struct({
  answerId: QuestionAnswerId,
  isCorrect: Schema.Boolean,
  // The explanation was opened before submitting, so the result is not independent mastery.
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
  explanation: Schema.NonEmptyString,
  answers: Schema.Array(SessionAnswerOption),
  // A withdrawn revision accepts no answer, even in a started session (ADR-0003).
  isWithdrawn: Schema.Boolean,
  // When the backend recorded opening the explanation; before submitting it marks the answer assisted.
  explanationOpenedAt: Schema.NullOr(UtcIsoDateTime),
  answer: Schema.NullOr(SessionAnswer),
})

export type SessionQuestion = typeof SessionQuestion.Type

export const SessionQuestionResponse = Schema.NullOr(SessionQuestion)

/** The question with its stored answer and the session progress after answering. */
export const SubmitSessionAnswerResponse = Schema.Struct({
  question: SessionQuestion,
  session: StudySession,
})

export type SubmitSessionAnswerResponse = typeof SubmitSessionAnswerResponse.Type

export const RecordSessionAssistanceResponse = SessionQuestion
