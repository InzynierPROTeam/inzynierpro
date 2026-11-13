import { Schema } from 'effect'
import { UtcIsoDateTime } from '~domain/common/date-time.js'
import { Uuid } from '~domain/common/id.js'

export const ExamSessionId = Uuid.pipe(Schema.brand('ExamSessionId'))

export type ExamSessionId = typeof ExamSessionId.Type

export const ExamSessionOption = Schema.Struct({
  id: ExamSessionId,
  name: Schema.NonEmptyString,
  writtenAt: UtcIsoDateTime,
  isConfirmed: Schema.Boolean,
})

export type ExamSessionOption = typeof ExamSessionOption.Type
