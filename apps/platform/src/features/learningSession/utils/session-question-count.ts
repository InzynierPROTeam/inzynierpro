import type { SessionCountSettings } from '@inzpro/api-contracts/modules/learning/responses'
import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'

export const getSessionQuestionCount = (
  settings: SessionCountSettings,
  requested: number | undefined,
): QuestionCount =>
  settings.canChangeQuestionCount &&
  requested !== undefined &&
  requested >= settings.minimumQuestionCount &&
  requested <= settings.maximumQuestionCount
    ? QuestionCount.make(requested)
    : settings.defaultQuestionCount
