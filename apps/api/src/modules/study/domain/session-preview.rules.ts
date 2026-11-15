import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import {
  repeatedQuestions,
  type SessionQuestionSelection,
  unansweredQuestions,
} from '@inzpro/domain/modules/study/study-session'
import { Schema } from 'effect'

import type { DocumentQuestionPool } from './study-document.model.js'

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

/**
 * The questions a new session of the document draws from: the ones not yet answered in regular
 * study, or every one again once the learner answered them all.
 */
export const sessionQuestionPool = (
  document: Pick<DocumentQuestionPool, 'availableQuestionCount' | 'completedQuestionCount'>,
): { selection: SessionQuestionSelection; questionCount: QuestionCount } =>
  document.availableQuestionCount > 0 &&
  document.completedQuestionCount >= document.availableQuestionCount
    ? { selection: repeatedQuestions, questionCount: document.availableQuestionCount }
    : {
        selection: unansweredQuestions,
        questionCount: QuestionCount.make(
          document.availableQuestionCount - document.completedQuestionCount,
        ),
      }
