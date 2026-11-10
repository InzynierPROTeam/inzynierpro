import { CursorPaginatedResponse } from '@inzpro/domain/common/pagination'
import { ExamSessionOption } from '@inzpro/domain/modules/exam-calendar/exam-session'

export const ExamSessionsResponse = CursorPaginatedResponse(ExamSessionOption)
