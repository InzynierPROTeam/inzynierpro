import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { Option } from 'effect'

import type { SessionCountSettings } from './session-preview.rules.js'

export const defaultReviewQuestionCount = 25

export const reviewSessionSettings = (
  dueCount: QuestionCount,
): Option.Option<SessionCountSettings> =>
  dueCount === 0
    ? Option.none()
    : Option.some({
        defaultQuestionCount: QuestionCount.make(Math.min(defaultReviewQuestionCount, dueCount)),
        canChangeQuestionCount: dueCount > 1,
        minimumQuestionCount: QuestionCount.make(1),
        maximumQuestionCount: dueCount,
      })
