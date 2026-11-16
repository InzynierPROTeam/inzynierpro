import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import type { Option } from 'effect'

import type { OralCategoryQuestionPool } from './oral-category.model.js'
import type { ReviewQueue } from './review-session.model.js'
import type { SessionCountSettings } from './session-preview.rules.js'

export type OralReviewPreview = {
  readonly qualificationPathId: QualificationPathId
  readonly category: Option.Option<OralCategoryQuestionPool>
  readonly queue: ReviewQueue
  readonly settings: Option.Option<SessionCountSettings>
}
