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
import {
  SessionQuestionPosition,
  StudySessionId,
  StudySessionKind,
} from '@inzpro/domain/modules/learning/study-session'
import { UserExamGoalVersion } from '@inzpro/domain/modules/preparation/user-exam-goal'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import type { RichContent } from '@inzpro/rich-content/rich-content'
import { type Option, Schema } from 'effect'
import type { QuestionNote } from '~api/modules/learning/domain/question-note.model.js'

export const StudySession = Schema.Struct({
  id: StudySessionId,
  kind: StudySessionKind,
  documentId: Schema.OptionFromNullOr(ReferenceDocumentId),
  documentTitle: Schema.OptionFromNullOr(Schema.NonEmptyString),
  goalVersion: UserExamGoalVersion,
  questionCount: QuestionCount,
  currentPosition: SessionQuestionPosition,
  answeredCount: QuestionCount,
  skippedCount: QuestionCount,
  createdAt: DateTimeUtc,
  endedAt: Schema.OptionFromNullOr(DateTimeUtc),
})

export type StudySession = typeof StudySession.Type

export type SessionAnswer = {
  readonly answerId: QuestionAnswerId
  readonly isCorrect: boolean
  readonly isAssisted: boolean
  readonly answeredAt: DateTimeUtc
}

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
  readonly isWithdrawn: boolean
  readonly explanationOpenedAt: Option.Option<DateTimeUtc>
  readonly noteOpenedAt: Option.Option<DateTimeUtc>
  readonly answer: Option.Option<SessionAnswer>
  readonly isFavorite: boolean
  readonly note: Option.Option<QuestionNote>
}

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
