import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { Schema } from 'effect'

export const writtenStudySettings = (availableCount: QuestionCount) => ({
  defaultQuestionCount: availableCount,
  canChangeQuestionCount: availableCount > 25,
  minimumQuestionCount: availableCount > 25 ? Schema.decodeSync(QuestionCount)(1) : availableCount,
  maximumQuestionCount: availableCount,
})

/** Whether a new session may hold this many questions under the current preview settings. */
export const isAllowedQuestionCount = (
  settings: ReturnType<typeof writtenStudySettings>,
  questionCount: QuestionCount,
) =>
  questionCount > 0 &&
  questionCount >= settings.minimumQuestionCount &&
  questionCount <= settings.maximumQuestionCount
