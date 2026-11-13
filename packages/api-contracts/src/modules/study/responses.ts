import { OralQuestionCategoryId } from '@inzpro/domain/modules/learning-content/oral-question-category'
import {
  QuestionCount,
  ReferenceDocumentId,
} from '@inzpro/domain/modules/learning-content/reference-document'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Schema } from 'effect'
import { CursorPaginatedResponse } from '~api-contracts/utils/pagination.js'

export const DocumentQuestionPool = Schema.Struct({
  id: ReferenceDocumentId,
  title: Schema.NonEmptyString,
  availableQuestionCount: QuestionCount,
  completedQuestionCount: QuestionCount,
})

export type DocumentQuestionPool = typeof DocumentQuestionPool.Type

export const OralQuestionCategory = Schema.Struct({
  id: OralQuestionCategoryId,
  name: Schema.NonEmptyString,
})

export type OralQuestionCategory = typeof OralQuestionCategory.Type

export const DocumentResponse = Schema.Struct({ document: DocumentQuestionPool })

export const DocumentsResponse = CursorPaginatedResponse(DocumentQuestionPool)

export const SessionPreview = Schema.Struct({
  qualificationPathId: QualificationPathId,
  document: DocumentQuestionPool,
  mode: Schema.Literal('written-study'),
  availableQuestionCount: QuestionCount,
  settings: Schema.Struct({
    defaultQuestionCount: QuestionCount,
    canChangeQuestionCount: Schema.Boolean,
    minimumQuestionCount: QuestionCount,
    maximumQuestionCount: QuestionCount,
  }),
})

export type SessionPreview = typeof SessionPreview.Type

export const SessionPreviewResponse = Schema.NullOr(SessionPreview)

export const OralMaterialsResponse = CursorPaginatedResponse(OralQuestionCategory)
