import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { Option } from 'effect'
import type { SessionCountSettings } from '~api/modules/learning/domain/session-count.rules.js'

export const defaultOralReviewQuestionCount = 10

export const oralReviewSettings = (dueCount: QuestionCount): Option.Option<SessionCountSettings> =>
  dueCount === 0
    ? Option.none()
    : Option.some({
        defaultQuestionCount: QuestionCount.make(
          Math.min(defaultOralReviewQuestionCount, dueCount),
        ),
        canChangeQuestionCount: dueCount > 1,
        minimumQuestionCount: QuestionCount.make(1),
        maximumQuestionCount: dueCount,
      })
