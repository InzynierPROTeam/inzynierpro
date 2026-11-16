import {
  ByteSize,
  ContentAssetId,
  ContentAssetMediaType,
  ImageDimension,
} from '@inzpro/domain/modules/learning-content/content-asset'
import {
  KnowledgeCheckFormat,
  OralKnowledgeCheckId,
  OralKnowledgeCheckOptionId,
  OralKnowledgeCheckRevisionId,
  allowsSeveralOptions,
  hasFormatOptionCount,
} from '@inzpro/domain/modules/learning-content/oral-knowledge-check'
import {
  OralCategoryPosition,
  OralQuestionId,
  OralRevisionId,
} from '@inzpro/domain/modules/learning-content/oral-question'
import {
  OralQuestionCategoryId,
  OralQuestionCategorySortOrder,
} from '@inzpro/domain/modules/learning-content/oral-question-category'
import { QuestionAnswerId } from '@inzpro/domain/modules/learning-content/question-answer'
import { ReferenceDocumentId } from '@inzpro/domain/modules/learning-content/reference-document'
import {
  WrittenQuestionId,
  QuestionRevisionId,
} from '@inzpro/domain/modules/learning-content/written-question'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { RichContent } from '@inzpro/rich-content/rich-content'
import { Schema } from 'effect'

export const ReferenceDocument = Schema.Struct({
  id: ReferenceDocumentId,
  title: Schema.NonEmptyString,
})

export type ReferenceDocument = typeof ReferenceDocument.Type

export const ContentAsset = Schema.Struct({
  id: ContentAssetId,
  storageKey: Schema.NonEmptyString,
  mediaType: ContentAssetMediaType,
  width: ImageDimension,
  height: ImageDimension,
  size: ByteSize,
})

export type ContentAsset = typeof ContentAsset.Type

const NewQuestionAnswer = Schema.Struct({
  id: QuestionAnswerId,
  questionRevisionId: QuestionRevisionId,
  text: Schema.NonEmptyString,
  isCorrect: Schema.Boolean,
})

const hasValidAnswers = (revision: {
  readonly revisionId: QuestionRevisionId
  readonly answers: ReadonlyArray<typeof NewQuestionAnswer.Type>
}) =>
  new Set(revision.answers.map(answer => answer.id)).size === 3 &&
  revision.answers.filter(answer => answer.isCorrect).length === 1 &&
  revision.answers.every(answer => answer.questionRevisionId === revision.revisionId)

const validAnswersMessage =
  'A question needs three distinct answers for its revision, with exactly one correct answer.'

export const NewQuestion = Schema.Struct({
  id: WrittenQuestionId,
  revisionId: QuestionRevisionId,
  documentId: ReferenceDocumentId,
  qualificationPathId: QualificationPathId,
  body: Schema.NonEmptyString,
  answers: Schema.Array(NewQuestionAnswer).check(Schema.isMinLength(3), Schema.isMaxLength(3)),
  explanation: RichContent,
  published: Schema.Boolean,
}).check(Schema.makeFilter(hasValidAnswers, { message: validAnswersMessage }))

export type NewQuestion = typeof NewQuestion.Type

export const initialRevision = 'initial'
export const cosmeticChange = 'cosmetic'
export const substantiveChange = 'substantive'
export const revisionChangeKindValues = [cosmeticChange, substantiveChange] as const

export const RevisionChangeKind = Schema.Literals(revisionChangeKindValues)

export type RevisionChangeKind = typeof RevisionChangeKind.Type

export const NewQuestionRevision = Schema.Struct({
  questionId: WrittenQuestionId,
  revisionId: QuestionRevisionId,
  changeKind: RevisionChangeKind,
  body: Schema.NonEmptyString,
  answers: Schema.Array(NewQuestionAnswer).check(Schema.isMinLength(3), Schema.isMaxLength(3)),
  explanation: RichContent,
}).check(Schema.makeFilter(hasValidAnswers, { message: validAnswersMessage }))

export type NewQuestionRevision = typeof NewQuestionRevision.Type

export const QuestionRevisionWithdrawal = Schema.Struct({
  revisionId: QuestionRevisionId,
  reason: Schema.NonEmptyString,
})

export type QuestionRevisionWithdrawal = typeof QuestionRevisionWithdrawal.Type

export const OralQuestionCategory = Schema.Struct({
  id: OralQuestionCategoryId,
  name: Schema.NonEmptyString,
  sortOrder: OralQuestionCategorySortOrder,
})

export type OralQuestionCategory = typeof OralQuestionCategory.Type

export const NewOralQuestion = Schema.Struct({
  id: OralQuestionId,
  revisionId: OralRevisionId,
  categoryId: OralQuestionCategoryId,
  position: OralCategoryPosition,
  qualificationPathId: QualificationPathId,
  body: RichContent,
  answer: RichContent,
  published: Schema.Boolean,
})

export type NewOralQuestion = typeof NewOralQuestion.Type

export const OralDraftEdit = Schema.Struct({
  revisionId: OralRevisionId,
  body: RichContent,
  answer: RichContent,
})

export type OralDraftEdit = typeof OralDraftEdit.Type

export const NewOralRevision = Schema.Struct({
  questionId: OralQuestionId,
  revisionId: OralRevisionId,
  changeKind: RevisionChangeKind,
  body: RichContent,
  answer: RichContent,
})

export type NewOralRevision = typeof NewOralRevision.Type

export const OralRevisionWithdrawal = Schema.Struct({
  revisionId: OralRevisionId,
  reason: Schema.NonEmptyString,
})

export type OralRevisionWithdrawal = typeof OralRevisionWithdrawal.Type

const NewKnowledgeCheckOption = Schema.Struct({
  id: OralKnowledgeCheckOptionId,
  text: Schema.NonEmptyString,
  isCorrect: Schema.Boolean,
})

const hasValidOptions = (check: {
  readonly format: KnowledgeCheckFormat
  readonly options: ReadonlyArray<typeof NewKnowledgeCheckOption.Type>
}) => {
  const correctCount = check.options.filter(option => option.isCorrect).length

  return (
    new Set(check.options.map(option => option.id)).size === check.options.length &&
    hasFormatOptionCount(check.format, check.options.length) &&
    (allowsSeveralOptions(check.format) ? correctCount >= 1 : correctCount === 1)
  )
}

export const NewOralKnowledgeCheck = Schema.Struct({
  id: OralKnowledgeCheckId,
  revisionId: OralKnowledgeCheckRevisionId,
  questionId: OralQuestionId,
  oralRevisionId: OralRevisionId,
  format: KnowledgeCheckFormat,
  prompt: Schema.NonEmptyString,
  options: Schema.Array(NewKnowledgeCheckOption),
  explanation: RichContent,
  published: Schema.Boolean,
}).check(
  Schema.makeFilter(hasValidOptions, {
    message:
      'A knowledge check needs distinct options: single choice has three with exactly one correct, true/false two with exactly one correct and multiple choice four with at least one correct.',
  }),
)

export type NewOralKnowledgeCheck = typeof NewOralKnowledgeCheck.Type
