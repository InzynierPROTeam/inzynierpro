import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { type Option } from 'effect'
import type { ReviewQueue } from '~api/modules/learning/domain/review-queue.model.js'
import type { SessionCountSettings } from '~api/modules/learning/domain/session-count.rules.js'
import type { SessionDocument } from '~api/modules/written-study/domain/study-document.model.js'

export type ReviewPreview = {
  readonly qualificationPathId: QualificationPathId
  readonly document: Option.Option<SessionDocument>
  readonly queue: ReviewQueue
  readonly settings: Option.Option<SessionCountSettings>
}
