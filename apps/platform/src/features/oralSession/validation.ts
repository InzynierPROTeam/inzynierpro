import { OralSessionQuestionParams } from '@inzpro/api-contracts/modules/oral-study/requests'
import { OralQuestionCategoryId } from '@inzpro/domain/modules/learning-content/oral-question-category'
import { OralStudySessionId } from '@inzpro/domain/modules/oral-study/oral-study-session'
import { Schema } from 'effect'

export const OralPreviewSearch = Schema.Struct({
  kategoria: Schema.optional(OralQuestionCategoryId),
  'obecna-kategoria': Schema.optional(OralQuestionCategoryId),
  'liczba-pytan': Schema.optional(Schema.Int.check(Schema.isGreaterThan(0))),
})

export const OralSessionQuestionRouteParams = Schema.Struct({
  sessionId: OralStudySessionId,
  questionNumber: OralSessionQuestionParams.fields.position,
})

export const OralSessionSummaryRouteParams = Schema.Struct({ sessionId: OralStudySessionId })
