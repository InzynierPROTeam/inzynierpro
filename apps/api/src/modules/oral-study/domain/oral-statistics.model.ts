import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import type { OralKnowledgeCheckRevisionId } from '@inzpro/domain/modules/learning-content/oral-knowledge-check'
import type { OralRevisionId } from '@inzpro/domain/modules/learning-content/oral-question'
import { OralSelfAssessment } from '@inzpro/domain/modules/oral-study/oral-study-session'
import { Schema } from 'effect'
import { StatisticCount } from '~api/modules/learning/domain/learning-statistics.model.js'

export type OralStatisticSelfAssessment = {
  readonly oralRevisionId: OralRevisionId
  readonly selfAssessment: OralSelfAssessment
  readonly studyDay: DateTimeUtc
}

export type KnowledgeCheckStatisticAnswer = {
  readonly knowledgeCheckRevisionId: OralKnowledgeCheckRevisionId
  readonly isCorrect: boolean
  readonly studyDay: DateTimeUtc
}

export const OralSelfAssessmentStatistics = Schema.Struct({
  studyDay: DateTimeUtc,
  selfAssessment: OralSelfAssessment,
  assessmentCount: StatisticCount,
})

export type OralSelfAssessmentStatistics = typeof OralSelfAssessmentStatistics.Type

export const KnowledgeCheckStatistics = Schema.Struct({
  studyDay: DateTimeUtc,
  answerCount: StatisticCount,
  correctCount: StatisticCount,
})

export type KnowledgeCheckStatistics = typeof KnowledgeCheckStatistics.Type
