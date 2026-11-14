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
import { SessionQuestionPosition, StudySessionId } from '@inzpro/domain/modules/study/study-session'
import { Schema } from 'effect'

/** A started study session: its material, fixed size and how far the learner got. */
export const StudySession = Schema.Struct({
  id: StudySessionId,
  documentId: ReferenceDocumentId,
  documentTitle: Schema.NonEmptyString,
  // The goal version active at the start; later goal changes never reattribute this session.
  goalVersion: UserExamGoalVersion,
  questionCount: QuestionCount,
  // The question to continue from; answering moves it forward.
  currentPosition: SessionQuestionPosition,
  answeredCount: QuestionCount,
  createdAt: DateTimeUtc,
  endedAt: Schema.OptionFromNullOr(DateTimeUtc),
})

export type StudySession = typeof StudySession.Type

/** A question of a started session as pinned at its start, with options in the stored order. */
export type SessionQuestion = {
  readonly sessionId: StudySessionId
  readonly position: SessionQuestionPosition
  readonly questionId: WrittenQuestionId
  readonly questionRevisionId: QuestionRevisionId
  readonly body: string
  readonly explanation: string
  readonly answers: ReadonlyArray<{
    readonly id: QuestionAnswerId
    readonly text: string
    readonly isCorrect: boolean
  }>
}

/** A currently published question revision that a new session may include. */
export const SessionCandidate = Schema.Struct({
  questionId: WrittenQuestionId,
  questionRevisionId: QuestionRevisionId,
  answerIds: Schema.Array(QuestionAnswerId),
})

export type SessionCandidate = typeof SessionCandidate.Type

/** A session to persist: revision references and the chosen answer order, never content copies. */
export type NewStudySession = {
  readonly userId: UserId
  readonly qualificationPathId: QualificationPathId
  readonly documentId: ReferenceDocumentId
  readonly goalVersion: UserExamGoalVersion
  readonly questions: ReadonlyArray<SessionCandidate>
}
