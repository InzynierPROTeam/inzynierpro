import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import { QuestionAnswerId } from '@inzpro/domain/modules/learning-content/question-answer'
import type { QuestionRevisionId } from '@inzpro/domain/modules/learning-content/written-question'
import { Schema } from 'effect'
import { StatisticCount } from '~api/modules/learning/domain/learning-statistics.model.js'
import { LearningMode } from '~api/modules/learning/domain/review-state.model.js'
import { AssistanceLevel } from '~api/modules/written-study/domain/review-state.model.js'

export type WrittenStatisticAnswer = {
  readonly questionRevisionId: QuestionRevisionId
  readonly answerId: QuestionAnswerId
  readonly isCorrect: boolean
  readonly mode: LearningMode
  readonly assistance: AssistanceLevel
  readonly studyDay: DateTimeUtc
}

export const WrittenQuestionStatistics = Schema.Struct({
  mode: LearningMode,
  assistance: AssistanceLevel,
  studyDay: DateTimeUtc,
  answerCount: StatisticCount,
  correctCount: StatisticCount,
})

export type WrittenQuestionStatistics = typeof WrittenQuestionStatistics.Type

export const WrittenAnswerOptionStatistics = Schema.Struct({
  answerId: QuestionAnswerId,
  mode: LearningMode,
  assistance: AssistanceLevel,
  studyDay: DateTimeUtc,
  selectionCount: StatisticCount,
})

export type WrittenAnswerOptionStatistics = typeof WrittenAnswerOptionStatistics.Type
