import { QuestionAnswer } from '@inzpro/domain/modules/learning-content/question-answer'
import { ReferenceDocumentId } from '@inzpro/domain/modules/learning-content/reference-document'
import {
  WrittenQuestionId,
  QuestionRevisionId,
} from '@inzpro/domain/modules/learning-content/written-question'
import { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Schema } from 'effect'

const NewQuestionAnswer = Schema.Struct({
  id: QuestionAnswer.fields.id,
  questionRevisionId: QuestionAnswer.fields.questionRevisionId,
  text: QuestionAnswer.fields.text,
  isCorrect: QuestionAnswer.fields.isCorrect,
})

export const NewQuestion = Schema.Struct({
  id: WrittenQuestionId,
  revisionId: QuestionRevisionId,
  documentId: ReferenceDocumentId,
  qualificationPathId: QualificationPathId,
  body: Schema.NonEmptyString,
  answers: Schema.Array(NewQuestionAnswer).check(Schema.isMinLength(3), Schema.isMaxLength(3)),
  explanation: Schema.NonEmptyString,
  published: Schema.Boolean,
}).check(
  Schema.makeFilter(
    question => {
      const ids = new Set(question.answers.map(answer => answer.id))

      return (
        ids.size === 3 &&
        question.answers.filter(answer => answer.isCorrect).length === 1 &&
        question.answers.every(answer => answer.questionRevisionId === question.revisionId)
      )
    },
    {
      message:
        'A question needs three distinct answers for its revision, with exactly one correct answer.',
    },
  ),
)

export type NewQuestion = typeof NewQuestion.Type
