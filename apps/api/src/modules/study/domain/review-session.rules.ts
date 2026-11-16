import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { Option } from 'effect'

import type { SessionCountSettings } from './session-preview.rules.js'

/** A review session holds at most this many due questions unless the learner changes it (ADR-0002). */
const defaultReviewQuestionCount = 25

/**
 * The counts a review session may hold for the questions due now: up to 25 by default, any count
 * within the due ones, and never padded with questions that are not due. With nothing due no
 * session can start (ADR-0002).
 */
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
