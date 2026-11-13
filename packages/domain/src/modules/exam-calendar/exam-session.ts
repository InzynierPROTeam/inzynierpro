import { Schema } from 'effect'
import { Uuid } from '~domain/common/id.js'

export const ExamSessionId = Uuid.pipe(Schema.brand('ExamSessionId'))

export type ExamSessionId = typeof ExamSessionId.Type
