import { DocumentSectionAddress } from '@inzpro/domain/modules/learning-content/document-section-address'
import { OralQuestionId } from '@inzpro/domain/modules/learning-content/oral-question'
import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { WrittenQuestionId } from '@inzpro/domain/modules/learning-content/written-question'
import { RichContent } from '@inzpro/rich-content/rich-content'
import { Schema } from 'effect'

export const UnitQuestionCount = Schema.Struct({
  address: DocumentSectionAddress,
  writtenQuestionCount: QuestionCount,
  oralQuestionCount: QuestionCount,
})

export type UnitQuestionCount = typeof UnitQuestionCount.Type

export const LinkedWrittenQuestion = Schema.Struct({
  questionId: WrittenQuestionId,
  body: Schema.NonEmptyString,
})

export type LinkedWrittenQuestion = typeof LinkedWrittenQuestion.Type

export const LinkedOralQuestion = Schema.Struct({
  questionId: OralQuestionId,
  body: RichContent,
})

export type LinkedOralQuestion = typeof LinkedOralQuestion.Type
