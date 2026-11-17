import { SessionQuestionParams } from '@inzpro/api-contracts/modules/written-study/requests'
import { ReferenceDocumentId } from '@inzpro/domain/modules/learning-content/reference-document'
import { StudySessionId } from '@inzpro/domain/modules/learning/study-session'
import { Schema } from 'effect'

export const LearningPreviewSearch = Schema.Struct({
  'akt-prawny': Schema.optional(ReferenceDocumentId),
  'obecny-akt-prawny': Schema.optional(ReferenceDocumentId),
  'liczba-pytan': Schema.optional(Schema.Int.check(Schema.isGreaterThan(0))),
})

export const SessionQuestionRouteParams = Schema.Struct({
  sessionId: StudySessionId,
  questionNumber: SessionQuestionParams.fields.position,
})

export const SessionSummaryRouteParams = Schema.Struct({ sessionId: StudySessionId })
