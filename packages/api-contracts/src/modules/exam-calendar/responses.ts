import { UtcIsoDateTime } from '@inzpro/domain/common/date-time'
import { ExamSessionId } from '@inzpro/domain/modules/exam-calendar/exam-session'
import { Schema } from 'effect'
import { CursorPaginatedResponse } from '~api-contracts/utils/pagination.js'

export const ExamSessionOption = Schema.Struct({
  id: ExamSessionId,
  name: Schema.NonEmptyString,
  writtenAt: UtcIsoDateTime,
  isConfirmed: Schema.Boolean,
})

export type ExamSessionOption = typeof ExamSessionOption.Type

export const ExamSessionsResponse = CursorPaginatedResponse(ExamSessionOption)
