import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'

import type { OralCategoryQuestionPool } from './oral-category.model.js'
import type { SessionCountSettings } from './session-preview.rules.js'

export type OralSessionPreview = {
  readonly qualificationPathId: QualificationPathId
  readonly category: OralCategoryQuestionPool
  readonly settings: SessionCountSettings
}

const defaultOralQuestionCount = QuestionCount.make(10)

/** Ten questions by default, or all of them when fewer; with more available, any count from one to all (ADR-0002). */
export const oralStudySettings = (availableCount: QuestionCount): SessionCountSettings => {
  const canChangeQuestionCount = availableCount > defaultOralQuestionCount

  return {
    defaultQuestionCount: canChangeQuestionCount ? defaultOralQuestionCount : availableCount,
    canChangeQuestionCount,
    minimumQuestionCount: canChangeQuestionCount ? QuestionCount.make(1) : availableCount,
    maximumQuestionCount: availableCount,
  }
}
