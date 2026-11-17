import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import type {
  QuestionRevisionId,
  WrittenQuestionId,
} from '@inzpro/domain/modules/learning-content/written-question'
import type {
  SessionQuestionPosition,
  StudySessionId,
} from '@inzpro/domain/modules/learning/study-session'
import type {
  AttemptQuestionPosition,
  MockExamAttemptId,
} from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import type { UserExamGoalVersion } from '@inzpro/domain/modules/preparation/user-exam-goal'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Data, Schema } from 'effect'
import type {
  LearningMode,
  LearningEventId,
  ReviewCard,
} from '~api/modules/learning/domain/review-state.model.js'

export const noAssistance = 'none'

export const noteAssistance = 'note'

export const explanationAssistance = 'explanation'

export const assistanceLevels = [noAssistance, noteAssistance, explanationAssistance] as const

export const AssistanceLevel = Schema.Literals(assistanceLevels)

export type AssistanceLevel = typeof AssistanceLevel.Type

export const writtenReviewRulesVersion = 'written-1/fsrs-7'

export type LearningEventContext = {
  readonly mode: LearningMode
  readonly assistance: AssistanceLevel
  readonly answeredAt: DateTimeUtc
}

export type WrittenEvidenceSource = Data.TaggedEnum<{
  StudySessionAnswer: {
    readonly sessionId: StudySessionId
    readonly position: SessionQuestionPosition
  }
  MockExamAnswer: {
    readonly attemptId: MockExamAttemptId
    readonly position: AttemptQuestionPosition
  }
}>

export const WrittenEvidenceSource = Data.taggedEnum<WrittenEvidenceSource>()

export type NewWrittenEvidence = {
  readonly userId: UserId
  readonly qualificationPathId: QualificationPathId
  readonly goalVersion: UserExamGoalVersion
  readonly questionId: WrittenQuestionId
  readonly questionRevisionId: QuestionRevisionId
  readonly isCorrect: boolean
  readonly source: WrittenEvidenceSource
}

export type NewReviewState = {
  readonly userId: UserId
  readonly qualificationPathId: QualificationPathId
  readonly questionId: WrittenQuestionId
  readonly questionRevisionId: QuestionRevisionId
  readonly learningEventId: LearningEventId
  readonly rulesVersion: string
  readonly card: ReviewCard
}
