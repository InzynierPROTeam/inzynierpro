import type { ListExamSessionsEndpoint } from '@inzpro/api-contracts/modules/exam-calendar/api'
import type { Effect } from 'effect'
import { apiAction } from '~api-client/lib/api-action.js'
import type { InferEndpointRequest } from '~api-client/lib/types.js'

export const listExamSessions = (req: ListExamSessionsRequest) =>
  apiAction(api => api.ExamCalendar.ListExamSessions(req))

export type ListExamSessionsRequest = InferEndpointRequest<typeof ListExamSessionsEndpoint>

export type ListExamSessionsRes = Effect.Success<ReturnType<typeof listExamSessions>>

export type ListExamSessionsError = Effect.Error<ReturnType<typeof listExamSessions>>
