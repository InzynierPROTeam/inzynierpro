import { Schema } from 'effect'
import { Uuid } from '~domain/common/id.js'

export const WrittenQuestionId = Uuid.pipe(Schema.brand('WrittenQuestionId'))

export type WrittenQuestionId = typeof WrittenQuestionId.Type

export const QuestionRevisionId = Uuid.pipe(Schema.brand('QuestionRevisionId'))

export type QuestionRevisionId = typeof QuestionRevisionId.Type
