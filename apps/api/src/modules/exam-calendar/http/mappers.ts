import type { ExamSessionOption as ExamSessionOptionDto } from '@inzpro/api-contracts/modules/exam-calendar/responses'
import { dateTimeUtcToUtcIsoDateTime } from '@inzpro/domain/common/date-time'
import type { ExamSessionOption } from '~api/modules/exam-calendar/domain/exam-session.model.js'

export const toExamSessionOptionDto = (session: ExamSessionOption): ExamSessionOptionDto => ({
  ...session,
  writtenAt: dateTimeUtcToUtcIsoDateTime(session.writtenAt),
})
