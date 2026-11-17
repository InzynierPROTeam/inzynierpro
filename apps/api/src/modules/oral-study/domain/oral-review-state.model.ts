import type { DateTimeUtc } from '@inzpro/domain/common/date-time'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import type {
  OralQuestionId,
  OralRevisionId,
} from '@inzpro/domain/modules/learning-content/oral-question'
import type { SessionQuestionPosition } from '@inzpro/domain/modules/learning/study-session'
import type {
  OralQuizCheckPosition,
  OralSessionQuizId,
} from '@inzpro/domain/modules/oral-study/oral-session-quiz'
import type {
  OralSelfAssessment,
  OralStudySessionId,
} from '@inzpro/domain/modules/oral-study/oral-study-session'
import type { UserExamGoalVersion } from '@inzpro/domain/modules/preparation/user-exam-goal'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Data } from 'effect'
import type {
  LearningEventId,
  LearningMode,
  ReviewCard,
} from '~api/modules/learning/domain/review-state.model.js'

export const oralReviewRulesVersion = 'oral-1/fsrs-7'

export type NewOralEvidence = {
  readonly userId: UserId
  readonly qualificationPathId: QualificationPathId
  readonly goalVersion: UserExamGoalVersion
  readonly questionId: OralQuestionId
  readonly oralRevisionId: OralRevisionId
  readonly sessionId: OralStudySessionId
  readonly position: SessionQuestionPosition
  readonly selfAssessment: OralSelfAssessment
  readonly mode: LearningMode
  readonly answeredAt: DateTimeUtc
}

export type OralReviewEvidence = Data.TaggedEnum<{
  SelfAssessment: { readonly learningEventId: LearningEventId }
  QuizAnswer: { readonly quizId: OralSessionQuizId; readonly position: OralQuizCheckPosition }
}>

export const OralReviewEvidence = Data.taggedEnum<OralReviewEvidence>()

export type NewOralReviewState = {
  readonly userId: UserId
  readonly qualificationPathId: QualificationPathId
  readonly questionId: OralQuestionId
  readonly oralRevisionId: OralRevisionId
  readonly evidence: OralReviewEvidence
  readonly rulesVersion: string
  readonly card: ReviewCard
}
