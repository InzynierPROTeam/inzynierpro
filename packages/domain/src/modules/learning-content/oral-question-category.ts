import { Schema } from 'effect'
import { Uuid } from '~domain/common/id.js'

export const OralQuestionCategoryId = Uuid.pipe(Schema.brand('OralQuestionCategoryId'))

export type OralQuestionCategoryId = typeof OralQuestionCategoryId.Type

export const OralQuestionCategory = Schema.Struct({
  id: OralQuestionCategoryId,
  name: Schema.NonEmptyString,
})
