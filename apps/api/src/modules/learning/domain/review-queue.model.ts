import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { Schema } from 'effect'

export const ReviewQueue = Schema.Struct({
  dueCount: QuestionCount,
  nextDueAt: Schema.OptionFromNullOr(DateTimeUtc),
})

export type ReviewQueue = typeof ReviewQueue.Type
