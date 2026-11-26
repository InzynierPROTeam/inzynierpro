import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import type { OralQuestionScope } from '@inzpro/domain/modules/oral-study/oral-study-session'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import type { Option } from 'effect'
import type { SessionCountSettings } from '~api/modules/learning/domain/session-count.rules.js'
import type { OralCategoryQuestionPool } from '~api/modules/oral-study/domain/oral-category.model.js'

export type OralSessionPreview = {
  readonly qualificationPathId: QualificationPathId
  readonly questionScope: OralQuestionScope
  readonly category: OralCategoryQuestionPool
  readonly settings: SessionCountSettings
  readonly reportedInMyChamberQuestionCount: Option.Option<QuestionCount>
}

const defaultOralQuestionCount = QuestionCount.make(10)

export const oralStudySettings = (availableCount: QuestionCount): SessionCountSettings => {
  const canChangeQuestionCount = availableCount > defaultOralQuestionCount

  return {
    defaultQuestionCount: canChangeQuestionCount ? defaultOralQuestionCount : availableCount,
    canChangeQuestionCount,
    minimumQuestionCount: canChangeQuestionCount ? QuestionCount.make(1) : availableCount,
    maximumQuestionCount: availableCount,
  }
}
