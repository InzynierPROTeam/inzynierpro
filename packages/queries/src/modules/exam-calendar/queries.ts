import {
  listExamSessions,
  type ListExamSessionsRequest,
} from '@inzpro/api-client/modules/exam-calendar'
import type { HttpClient } from 'effect/http'
import {
  effectInfiniteQueryOptions,
  effectQueryOptions,
} from '~queries/lib/effect-query-options.js'

import { examCalendarKeys } from './keys.js'

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
