import type {
  ListExamSessionsRequest,
  ListDistrictChambersRequest,
} from '@inzpro/api-client/modules/exam-calendar'

export const examCalendarKeys = {
  all: ['exam-calendar'] as const,
  sessions: () => [...examCalendarKeys.all, 'sessions'] as const,
  districtChambers: () => [...examCalendarKeys.all, 'district-chambers'] as const,
  listDistrictChambers: (req: ListDistrictChambersRequest) =>
    [...examCalendarKeys.districtChambers(), 'listDistrictChambers', req] as const,
  listExamSessions: (req: ListExamSessionsRequest) =>
    [...examCalendarKeys.sessions(), 'listExamSessions', req] as const,
  listExamSessionsInfinite: (req: ListExamSessionsRequest) =>
    [...examCalendarKeys.listExamSessions(req), 'infinite'] as const,
}
