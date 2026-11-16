import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import {
  coveredQuestions,
  type SessionQuestionSelection,
  uncoveredQuestions,
} from '@inzpro/domain/modules/study/study-session'
import { Schema } from 'effect'

import type { DocumentQuestionPool } from './study-document.model.js'

/** The question counts a new session may hold, which the preview shows and the start rechecks. */
export type SessionCountSettings = {
  readonly defaultQuestionCount: QuestionCount
  readonly canChangeQuestionCount: boolean
  readonly minimumQuestionCount: QuestionCount
  readonly maximumQuestionCount: QuestionCount
}

/** What a new regular-study session of a document would hold; the start confirms it. */
export type SessionPreview = {
  readonly qualificationPathId: QualificationPathId
  readonly document: DocumentQuestionPool
  readonly mode: 'written-study'
  readonly questionSelection: SessionQuestionSelection
  readonly availableQuestionCount: QuestionCount
  readonly settings: SessionCountSettings
}

export const writtenStudySettings = (availableCount: QuestionCount): SessionCountSettings => ({
  defaultQuestionCount: availableCount,
  canChangeQuestionCount: availableCount > 25,
  minimumQuestionCount: availableCount > 25 ? Schema.decodeSync(QuestionCount)(1) : availableCount,
  maximumQuestionCount: availableCount,
})

/** Whether a new session may hold this many questions under the current preview settings. */
export const isAllowedQuestionCount = (
  settings: SessionCountSettings,
  questionCount: QuestionCount,
) =>
  questionCount > 0 &&
  questionCount >= settings.minimumQuestionCount &&
  questionCount <= settings.maximumQuestionCount

/**
 * The questions a new session of the document draws from: the ones not yet covered in the current
 * LearningRound, or every one again when the learner chose a document already covered in it.
 */
export const sessionQuestionPool = (
  document: Pick<DocumentQuestionPool, 'availableQuestionCount' | 'completedQuestionCount'>,
): { selection: SessionQuestionSelection; questionCount: QuestionCount } =>
  document.availableQuestionCount > 0 &&
  document.completedQuestionCount >= document.availableQuestionCount
    ? { selection: coveredQuestions, questionCount: document.availableQuestionCount }
    : {
        selection: uncoveredQuestions,
        questionCount: QuestionCount.make(
          document.availableQuestionCount - document.completedQuestionCount,
        ),
      }
