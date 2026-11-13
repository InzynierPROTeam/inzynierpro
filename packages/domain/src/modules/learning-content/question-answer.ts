import { Schema } from 'effect'
import { Uuid } from '~domain/common/id.js'

export const QuestionAnswerId = Uuid.pipe(Schema.brand('QuestionAnswerId'))

export type QuestionAnswerId = typeof QuestionAnswerId.Type
