import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'

export type SessionCountSettings = {
  readonly defaultQuestionCount: QuestionCount
  readonly canChangeQuestionCount: boolean
  readonly minimumQuestionCount: QuestionCount
  readonly maximumQuestionCount: QuestionCount
}

export const isAllowedQuestionCount = (
  settings: SessionCountSettings,
  questionCount: QuestionCount,
) =>
  questionCount > 0 &&
  questionCount >= settings.minimumQuestionCount &&
  questionCount <= settings.maximumQuestionCount
