import {
  listExamSessions,
  type ListExamSessionsRequest,
} from '@inzpro/api-client/modules/exam-calendar'
import type { HttpClient } from 'effect/http'
import {
  effectInfiniteQueryOptions,
  effectQueryOptions,
} from '~queries/lib/effect-query-options.js'

export const examCalendarKeys = {
  all: ['exam-calendar'] as const,
  sessions: () => [...examCalendarKeys.all, 'sessions'] as const,
  listExamSessions: (req: ListExamSessionsRequest) =>
    [...examCalendarKeys.sessions(), 'listExamSessions', req] as const,
  listExamSessionsInfinite: (req: ListExamSessionsRequest) =>
    [...examCalendarKeys.listExamSessions(req), 'infinite'] as const,
}

export const examSessionsInfiniteQueryOptions = (
  httpClient: HttpClient.HttpClient,
  req: ListExamSessionsRequest,
) =>
  effectInfiniteQueryOptions(
    examCalendarKeys.listExamSessionsInfinite(req),
    cursor => listExamSessions({ ...req, query: { ...req.query, cursor } }),
    httpClient,
    req.query.cursor,
  )

export const examSessionsQueryOptions = (
  httpClient: HttpClient.HttpClient,
  req: ListExamSessionsRequest,
) => effectQueryOptions(examCalendarKeys.listExamSessions(req), listExamSessions(req), httpClient)
