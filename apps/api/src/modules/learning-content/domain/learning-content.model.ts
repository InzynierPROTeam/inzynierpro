import { QuestionAnswerId } from '@inzpro/domain/modules/learning-content/question-answer'
import { ReferenceDocumentId } from '@inzpro/domain/modules/learning-content/reference-document'
import {
  WrittenQuestionId,
  QuestionRevisionId,
} from '@inzpro/domain/modules/learning-content/written-question'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Schema } from 'effect'

export const ReferenceDocument = Schema.Struct({
  id: ReferenceDocumentId,
  title: Schema.NonEmptyString,
})

export type ReferenceDocument = typeof ReferenceDocument.Type

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
  explanation: Schema.NonEmptyString,
  published: Schema.Boolean,
}).check(Schema.makeFilter(hasValidAnswers, { message: validAnswersMessage }))

export type NewQuestion = typeof NewQuestion.Type

export const initialRevision = 'initial'
export const cosmeticChange = 'cosmetic'
export const substantiveChange = 'substantive'
export const revisionChangeKindValues = [cosmeticChange, substantiveChange] as const

/** Substantive changes reset coverage across paths; cosmetic changes preserve learning state (ADR-0003). */
export const RevisionChangeKind = Schema.Literals(revisionChangeKindValues)

export type RevisionChangeKind = typeof RevisionChangeKind.Type

/**
 * A newer published revision of an existing question; earlier revisions stay unchanged and started
 * sessions keep answering the revision they pinned (ADR-0003).
 */
export const NewQuestionRevision = Schema.Struct({
  questionId: WrittenQuestionId,
  revisionId: QuestionRevisionId,
  changeKind: RevisionChangeKind,
  body: Schema.NonEmptyString,
  answers: Schema.Array(NewQuestionAnswer).check(Schema.isMinLength(3), Schema.isMaxLength(3)),
  explanation: Schema.NonEmptyString,
}).check(Schema.makeFilter(hasValidAnswers, { message: validAnswersMessage }))

export type NewQuestionRevision = typeof NewQuestionRevision.Type

/**
 * An emergency withdrawal of a faulty published revision. Unlike publishing a newer revision, it
 * blocks further answers even in started sessions; history and the reason are kept (ADR-0003).
 */
export const QuestionRevisionWithdrawal = Schema.Struct({
  revisionId: QuestionRevisionId,
  reason: Schema.NonEmptyString,
})

export type QuestionRevisionWithdrawal = typeof QuestionRevisionWithdrawal.Type
