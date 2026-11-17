import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import {
  coveredQuestions,
  type SessionQuestionSelection,
  uncoveredQuestions,
} from '@inzpro/domain/modules/learning/study-session'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Schema } from 'effect'
import type { SessionCountSettings } from '~api/modules/learning/domain/session-count.rules.js'
import type { DocumentQuestionPool } from '~api/modules/written-study/domain/study-document.model.js'

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
