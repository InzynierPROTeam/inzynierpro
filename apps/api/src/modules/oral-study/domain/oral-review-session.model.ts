import type { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import type { OralQuestionScope } from '@inzpro/domain/modules/oral-study/oral-study-session'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import type { Option } from 'effect'
import type { ReviewQueue } from '~api/modules/learning/domain/review-queue.model.js'
import type { SessionCountSettings } from '~api/modules/learning/domain/session-count.rules.js'
import type { OralCategoryQuestionPool } from '~api/modules/oral-study/domain/oral-category.model.js'

export type OralReviewPreview = {
  readonly qualificationPathId: QualificationPathId
  readonly questionScope: OralQuestionScope
  readonly category: Option.Option<OralCategoryQuestionPool>
  readonly queue: ReviewQueue
  readonly settings: Option.Option<SessionCountSettings>
  readonly reportedInMyChamberQuestionCount: Option.Option<QuestionCount>
}
