import {
  QuestionCount,
  ReferenceDocumentId,
} from '@inzpro/domain/modules/learning-content/reference-document'
import { Schema } from 'effect'

/** A reference document on a path with the learner's coverage of its published questions in the current round. */
export const DocumentQuestionPool = Schema.Struct({
  id: ReferenceDocumentId,
  title: Schema.NonEmptyString,
  availableQuestionCount: QuestionCount,
  completedQuestionCount: QuestionCount,
})

export type DocumentQuestionPool = typeof DocumentQuestionPool.Type

export const SessionDocument = Schema.Struct({
  id: ReferenceDocumentId,
  title: Schema.NonEmptyString,
})

export type SessionDocument = typeof SessionDocument.Type
