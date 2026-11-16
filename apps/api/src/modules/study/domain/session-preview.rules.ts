import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import {
  coveredQuestions,
  type SessionQuestionSelection,
  uncoveredQuestions,
} from '@inzpro/domain/modules/study/study-session'
import { Schema } from 'effect'

import type { DocumentQuestionPool } from './study-document.model.js'

export type SessionCountSettings = {
  readonly defaultQuestionCount: QuestionCount
  readonly canChangeQuestionCount: boolean
  readonly minimumQuestionCount: QuestionCount
  readonly maximumQuestionCount: QuestionCount
}

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

export const isAllowedQuestionCount = (
  settings: SessionCountSettings,
  questionCount: QuestionCount,
) =>
  questionCount > 0 &&
  questionCount >= settings.minimumQuestionCount &&
  questionCount <= settings.maximumQuestionCount

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
