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
  SessionQuestionPosition,
  StudySessionId,
  StudySessionStatus,
} from '@inzpro/domain/modules/study/study-session'
import { Schema } from 'effect'
import { CursorPaginatedResponse } from '~api-contracts/utils/pagination.js'

export const DocumentQuestionPool = Schema.Struct({
  id: ReferenceDocumentId,
  title: Schema.NonEmptyString,
  availableQuestionCount: QuestionCount,
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

export const SessionPreview = Schema.Struct({
  qualificationPathId: QualificationPathId,
  document: DocumentQuestionPool,
  mode: Schema.Literal('written-study'),
  availableQuestionCount: QuestionCount,
  settings: Schema.Struct({
    defaultQuestionCount: QuestionCount,
    canChangeQuestionCount: Schema.Boolean,
    minimumQuestionCount: QuestionCount,
    maximumQuestionCount: QuestionCount,
  }),
})

export type SessionPreview = typeof SessionPreview.Type

export const SessionPreviewResponse = Schema.NullOr(SessionPreview)

export const OralMaterialsResponse = CursorPaginatedResponse(OralQuestionCategory)

/** How far a session got: what the progress bar and the continue link need. */
export const StudySessionProgress = Schema.Struct({
  total: QuestionCount,
  answered: QuestionCount,
  percent: Percent,
  // The question to continue from.
  currentQuestion: SessionQuestionPosition,
})

export type StudySessionProgress = typeof StudySessionProgress.Type

export const StudySession = Schema.Struct({
  id: StudySessionId,
  status: StudySessionStatus,
  progress: StudySessionProgress,
  createdAt: UtcIsoDateTime,
  endedAt: Schema.NullOr(UtcIsoDateTime),
})

export type StudySession = typeof StudySession.Type

export const StartSessionResponse = StudySession

export const StudySessionResponse = Schema.NullOr(StudySession)

/** The most recent session with the material it covers, for continue tiles outside the session. */
export const LatestStudySession = Schema.Struct({
  ...StudySession.fields,
  document: Schema.Struct({ id: ReferenceDocumentId, title: Schema.NonEmptyString }),
})

export type LatestStudySession = typeof LatestStudySession.Type

export const LatestStudySessionResponse = Schema.NullOr(LatestStudySession)

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
