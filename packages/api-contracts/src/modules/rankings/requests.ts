import { ExamSessionId } from '@inzpro/domain/modules/exam-calendar/exam-session'
import { RankingPeriod } from '@inzpro/domain/modules/rankings/ranking'
import { Schema } from 'effect'

export const PeriodRankingParams = Schema.Struct({ period: RankingPeriod })

export type PeriodRankingParams = typeof PeriodRankingParams.Type

export const ExamSessionRankingParams = Schema.Struct({ examSessionId: ExamSessionId })

export type ExamSessionRankingParams = typeof ExamSessionRankingParams.Type
