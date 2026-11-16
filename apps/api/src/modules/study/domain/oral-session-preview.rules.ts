import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import type { OralQuestionScope } from '@inzpro/domain/modules/study/oral-study-session'

import type { OralCategoryQuestionPool } from './oral-category.model.js'
import type { SessionCountSettings } from './session-preview.rules.js'

export type OralSessionPreview = {
  readonly qualificationPathId: QualificationPathId
  readonly questionScope: OralQuestionScope
  readonly category: OralCategoryQuestionPool
  readonly settings: SessionCountSettings
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
