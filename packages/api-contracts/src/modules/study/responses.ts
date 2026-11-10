import { CursorPaginatedResponse } from '@inzpro/domain/common/pagination'
import { OralQuestionCategory } from '@inzpro/domain/modules/learning-content/oral-question-category'
import {
  DocumentQuestionPool,
  QuestionCount,
} from '@inzpro/domain/modules/learning-content/reference-document'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Schema } from 'effect'

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

export const OralMaterialsResponse = CursorPaginatedResponse(OralQuestionCategory)
