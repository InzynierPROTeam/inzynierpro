import { DateTimeUtc } from '@inzpro/domain/common/date-time'
import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { type Option, Schema } from 'effect'

import type { SessionCountSettings } from './session-preview.rules.js'
import type { SessionDocument } from './study-document.model.js'

/** How many questions of a review scope are due now, and when the next one becomes due. */
export const ReviewQueue = Schema.Struct({
  dueCount: QuestionCount,
  // The earliest due time after now; none when nothing later is scheduled.
  nextDueAt: Schema.OptionFromNullOr(DateTimeUtc),
})

export type ReviewQueue = typeof ReviewQueue.Type

/** The due questions of a review scope with the counts a new review session may hold. */
export type ReviewPreview = {
  readonly qualificationPathId: QualificationPathId
  // None for reviews of the whole path.
  readonly document: Option.Option<SessionDocument>
  readonly queue: ReviewQueue
  // None when nothing is due, so no review session can start.
  readonly settings: Option.Option<SessionCountSettings>
}
