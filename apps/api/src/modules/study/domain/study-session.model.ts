import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import { QuestionAnswerId } from '@inzpro/domain/modules/learning-content/question-answer'
import {
  QuestionCount,
  ReferenceDocumentId,
} from '@inzpro/domain/modules/learning-content/reference-document'
import {
  QuestionRevisionId,
  WrittenQuestionId,
} from '@inzpro/domain/modules/learning-content/written-question'
import { UserExamGoalVersion } from '@inzpro/domain/modules/preparation/user-exam-goal'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import {
  SessionQuestionPosition,
  StudySessionId,
  StudySessionKind,
} from '@inzpro/domain/modules/study/study-session'
import type { RichContent } from '@inzpro/rich-content/rich-content'
import { type Option, Schema } from 'effect'

import type { QuestionNote } from './question-note.model.js'

export const StudySession = Schema.Struct({
  id: StudySessionId,
  kind: StudySessionKind,
  // Regular study always has a document; a review or favourites session of the whole path has none.
  documentId: Schema.OptionFromNullOr(ReferenceDocumentId),
  documentTitle: Schema.OptionFromNullOr(Schema.NonEmptyString),
  // The goal version active at the start; later goal changes never reattribute this session.
  goalVersion: UserExamGoalVersion,
  questionCount: QuestionCount,
  currentPosition: SessionQuestionPosition,
  answeredCount: QuestionCount,
  // Questions whose revision was withdrawn before they were answered and before the session ended (ADR-0003).
  skippedCount: QuestionCount,
  createdAt: DateTimeUtc,
  endedAt: Schema.OptionFromNullOr(DateTimeUtc),
})

export type StudySession = typeof StudySession.Type

/** The learner's single submitted answer to a session question, as scored when it was stored. */
export type SessionAnswer = {
  readonly answerId: QuestionAnswerId
  readonly isCorrect: boolean
  readonly isAssisted: boolean
  readonly answeredAt: DateTimeUtc
}

/** A question of a started session as pinned at its start, with options in the stored order. */
export type SessionQuestion = {
  readonly sessionId: StudySessionId
  readonly position: SessionQuestionPosition
  readonly questionId: WrittenQuestionId
  readonly questionRevisionId: QuestionRevisionId
  readonly body: string
  readonly explanation: RichContent
  readonly answers: ReadonlyArray<{
    readonly id: QuestionAnswerId
    readonly text: string
    readonly isCorrect: boolean
  }>
  // A withdrawn revision accepts no further answers, even in a started session (ADR-0003).
  readonly isWithdrawn: boolean
  readonly explanationOpenedAt: Option.Option<DateTimeUtc>
  // Recorded only when a saved note was opened while an answer could still follow (ADR-0002).
  readonly noteOpenedAt: Option.Option<DateTimeUtc>
  readonly answer: Option.Option<SessionAnswer>
  // The learner's FavoriteQuestion mark now, shared across their paths.
  readonly isFavorite: boolean
  // The learner's PersonalQuestionNote now, shared across their paths.
  readonly note: Option.Option<QuestionNote>
}

/**
 * A scored answer to store with its learning evidence. Assistance comes from the backend's records
 * of opening the explanation or the note, never from the client; the goal version is the session's.
 */
export type NewSessionAnswer = {
  readonly userId: UserId
  readonly qualificationPathId: QualificationPathId
  readonly goalVersion: UserExamGoalVersion
  readonly sessionId: StudySessionId
  readonly position: SessionQuestionPosition
  readonly questionId: WrittenQuestionId
  readonly questionRevisionId: QuestionRevisionId
  readonly answerId: QuestionAnswerId
  readonly isCorrect: boolean
  readonly isAssisted: boolean
}

export const SessionCandidate = Schema.Struct({
  questionId: WrittenQuestionId,
  questionRevisionId: QuestionRevisionId,
  answerIds: Schema.Array(QuestionAnswerId),
})

export type SessionCandidate = typeof SessionCandidate.Type

export type NewStudySession = {
  readonly userId: UserId
  readonly qualificationPathId: QualificationPathId
  readonly kind: StudySessionKind
  readonly documentId: Option.Option<ReferenceDocumentId>
  readonly goalVersion: UserExamGoalVersion
  readonly questions: ReadonlyArray<SessionCandidate>
}

/** The answers of a session counted by result; assisted answers also count as correct or incorrect. */
export const StudySessionResultCounts = Schema.Struct({
  correct: QuestionCount,
  incorrect: QuestionCount,
  assisted: QuestionCount,
})

export type StudySessionResultCounts = typeof StudySessionResultCounts.Type

export type SessionQuestionResult = {
  readonly position: SessionQuestionPosition
  readonly answer: Option.Option<{ readonly isCorrect: boolean; readonly isAssisted: boolean }>
  readonly isWithdrawn: boolean
}
