import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { type Option, Schema } from 'effect'

import type { SessionCountSettings } from './session-preview.rules.js'
import type { SessionDocument } from './study-document.model.js'

export const ReviewQueue = Schema.Struct({
  dueCount: QuestionCount,
  nextDueAt: Schema.OptionFromNullOr(DateTimeUtc),
})

export type ReviewQueue = typeof ReviewQueue.Type

export type ReviewPreview = {
  readonly qualificationPathId: QualificationPathId
  readonly document: Option.Option<SessionDocument>
  readonly queue: ReviewQueue
  readonly settings: Option.Option<SessionCountSettings>
}
