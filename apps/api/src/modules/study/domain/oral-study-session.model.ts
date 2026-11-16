import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import type {
  OralQuestionId,
  OralRevisionId,
} from '@inzpro/domain/modules/learning-content/oral-question'
import { OralQuestionCategoryId } from '@inzpro/domain/modules/learning-content/oral-question-category'
import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { UserExamGoalVersion } from '@inzpro/domain/modules/preparation/user-exam-goal'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import {
  type OralSelfAssessment,
  OralStudySessionId,
} from '@inzpro/domain/modules/study/oral-study-session'
import {
  StudySessionKind,
  SessionQuestionPosition,
} from '@inzpro/domain/modules/study/study-session'
import type { RichContent } from '@inzpro/rich-content/rich-content'
import { type Option, Schema } from 'effect'

import type { QuestionNote } from './question-note.model.js'

export const OralStudySession = Schema.Struct({
  id: OralStudySessionId,
  kind: StudySessionKind,
  categoryId: Schema.OptionFromNullOr(OralQuestionCategoryId),
  categoryName: Schema.OptionFromNullOr(Schema.NonEmptyString),
  goalVersion: UserExamGoalVersion,
  questionCount: QuestionCount,
  currentPosition: SessionQuestionPosition,
  answeredCount: QuestionCount,
  skippedCount: QuestionCount,
  createdAt: DateTimeUtc,
  endedAt: Schema.OptionFromNullOr(DateTimeUtc),
})

export type OralStudySession = typeof OralStudySession.Type

export type StoredOralSelfAssessment = {
  readonly value: OralSelfAssessment
  readonly assessedAt: DateTimeUtc
}

export type OralSessionQuestion = {
  readonly sessionId: OralStudySessionId
  readonly position: SessionQuestionPosition
  readonly questionId: OralQuestionId
  readonly oralRevisionId: OralRevisionId
  readonly body: RichContent
  readonly answer: RichContent
  readonly note: Option.Option<QuestionNote>
  readonly isFavorite: boolean
  readonly isWithdrawn: boolean
  readonly selfAssessment: Option.Option<StoredOralSelfAssessment>
}

export type OralSessionCandidate = {
  readonly questionId: OralQuestionId
  readonly oralRevisionId: OralRevisionId
}

export type NewOralStudySession = {
  readonly userId: UserId
  readonly qualificationPathId: QualificationPathId
  readonly categoryId: Option.Option<OralQuestionCategoryId>
  readonly kind: StudySessionKind
  readonly goalVersion: UserExamGoalVersion
  readonly questions: ReadonlyArray<OralSessionCandidate>
}

export const OralSessionResultCounts = Schema.Struct({
  hard: QuestionCount,
  medium: QuestionCount,
  easy: QuestionCount,
})

export type OralSessionResultCounts = typeof OralSessionResultCounts.Type

export type OralSessionQuestionResult = {
  readonly position: SessionQuestionPosition
  readonly selfAssessment: Option.Option<OralSelfAssessment>
  readonly isWithdrawn: boolean
}
