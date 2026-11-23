import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import { Percent } from '@inzpro/domain/common/percent'
import {
  ExamActiveSeconds,
  type MockExamAttemptId,
} from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import { Schema } from 'effect'
import { StatisticCount } from '~api/modules/learning/domain/learning-statistics.model.js'

export type FinishedAttemptStatistic = {
  readonly attemptId: MockExamAttemptId
  readonly studyDay: DateTimeUtc
  readonly percent: Percent
  readonly isPassed: boolean
  readonly activeSeconds: ExamActiveSeconds
}

export const MockExamStatistics = Schema.Struct({
  studyDay: DateTimeUtc,
  finishedCount: StatisticCount,
  passedCount: StatisticCount,
  activeSeconds: ExamActiveSeconds,
})

export type MockExamStatistics = typeof MockExamStatistics.Type

export const MockExamScoreStatistics = Schema.Struct({
  studyDay: DateTimeUtc,
  percent: Percent,
  attemptCount: StatisticCount,
})

export type MockExamScoreStatistics = typeof MockExamScoreStatistics.Type
