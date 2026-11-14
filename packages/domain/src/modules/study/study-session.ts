import { Schema } from 'effect'
import { Uuid } from '~domain/common/id.js'
import type { QuestionCount } from '~domain/modules/learning-content/reference-document.js'

export const StudySessionId = Uuid.pipe(Schema.brand('StudySessionId'))

export type StudySessionId = typeof StudySessionId.Type

/** The 1-based place of a question in a session's fixed question set. */
export const SessionQuestionPosition = Schema.Int.check(Schema.isGreaterThan(0)).pipe(
  Schema.brand('SessionQuestionPosition'),
)

export type SessionQuestionPosition = typeof SessionQuestionPosition.Type

export const activeStudySession = 'active'
export const endedStudySession = 'ended'
export const studySessionStatusValues = [activeStudySession, endedStudySession] as const

/** An active session can be continued; an ended one only keeps its results. */
export const StudySessionStatus = Schema.Literals(studySessionStatusValues)

export type StudySessionStatus = typeof StudySessionStatus.Type

/** The question to continue from after answering one: the next one, or the last when it was the last. */
export const nextQuestionPosition = (
  answered: SessionQuestionPosition,
  questionCount: QuestionCount,
): SessionQuestionPosition => SessionQuestionPosition.make(Math.min(answered + 1, questionCount))

export const unansweredQuestions = 'unanswered'
export const repeatedQuestions = 'repeat'
export const sessionQuestionSelectionValues = [unansweredQuestions, repeatedQuestions] as const

/**
 * Which questions a new regular-study session draws: those not yet answered in the scope, or,
 * once every one was answered, all of them again. Full LearningRound tracking is a later scope.
 */
export const SessionQuestionSelection = Schema.Literals(sessionQuestionSelectionValues)

export type SessionQuestionSelection = typeof SessionQuestionSelection.Type
