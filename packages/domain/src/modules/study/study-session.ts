import { Schema } from 'effect'
import { Uuid } from '~domain/common/id.js'
import { QuestionCount } from '~domain/modules/learning-content/reference-document.js'

export const StudySessionId = Uuid.pipe(Schema.brand('StudySessionId'))

export type StudySessionId = typeof StudySessionId.Type

export const SessionQuestionPosition = Schema.Int.check(Schema.isGreaterThan(0)).pipe(
  Schema.brand('SessionQuestionPosition'),
)

export type SessionQuestionPosition = typeof SessionQuestionPosition.Type

export const activeStudySession = 'active'
export const endedStudySession = 'ended'
export const studySessionStatusValues = [activeStudySession, endedStudySession] as const

export const StudySessionStatus = Schema.Literals(studySessionStatusValues)

export type StudySessionStatus = typeof StudySessionStatus.Type

export const nextQuestionPosition = (
  answered: SessionQuestionPosition,
  questionCount: QuestionCount,
): SessionQuestionPosition => SessionQuestionPosition.make(Math.min(answered + 1, questionCount))

export const scoredQuestionCount = (progress: {
  readonly total: QuestionCount
  readonly skipped: QuestionCount
}): QuestionCount => QuestionCount.make(Math.max(progress.total - progress.skipped, 0))

export const hasOpenQuestions = (progress: {
  readonly total: QuestionCount
  readonly answered: QuestionCount
  readonly skipped: QuestionCount
}): boolean => progress.answered < scoredQuestionCount(progress)

export const uncoveredQuestions = 'uncovered'
export const coveredQuestions = 'covered'
export const sessionQuestionSelectionValues = [uncoveredQuestions, coveredQuestions] as const

export const SessionQuestionSelection = Schema.Literals(sessionQuestionSelectionValues)

export type SessionQuestionSelection = typeof SessionQuestionSelection.Type

export const regularStudySession = 'study'
export const reviewStudySession = 'review'
export const favoritesStudySession = 'favourites'

export const studySessionKindValues = [
  regularStudySession,
  reviewStudySession,
  favoritesStudySession,
] as const

export const StudySessionKind = Schema.Literals(studySessionKindValues)

export type StudySessionKind = typeof StudySessionKind.Type

export const reviewNextStep = 'review'
export const continueStudyNextStep = 'continue-study'
export const startStudyNextStep = 'start-study'

export const sessionNextStepValues = [
  reviewNextStep,
  continueStudyNextStep,
  startStudyNextStep,
] as const

export const SessionNextStepType = Schema.Literals(sessionNextStepValues)

export type SessionNextStepType = typeof SessionNextStepType.Type

export const explanationAssistanceKind = 'explanation'
export const noteAssistanceKind = 'note'

export const sessionAssistanceKindValues = [explanationAssistanceKind, noteAssistanceKind] as const

export const SessionAssistanceKind = Schema.Literals(sessionAssistanceKindValues)

export type SessionAssistanceKind = typeof SessionAssistanceKind.Type
