import type { ListExamSessionsRequest } from '@inzpro/api-client/modules/exam-calendar'

export const examCalendarKeys = {
  all: ['exam-calendar'] as const,
  sessions: () => [...examCalendarKeys.all, 'sessions'] as const,
  listExamSessions: (req: ListExamSessionsRequest) =>
    [...examCalendarKeys.sessions(), 'listExamSessions', req] as const,
  listExamSessionsInfinite: (req: ListExamSessionsRequest) =>
    [...examCalendarKeys.listExamSessions(req), 'infinite'] as const,
}
