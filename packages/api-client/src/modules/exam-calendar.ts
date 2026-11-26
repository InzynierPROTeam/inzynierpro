import type {
  ListExamSessionsEndpoint,
  ListDistrictChambersEndpoint,
} from '@inzpro/api-contracts/modules/exam-calendar/api'
import type { Effect } from 'effect'
import { apiAction } from '~api-client/lib/api-action.js'
import type { InferEndpointRequest } from '~api-client/lib/types.js'

export const listExamSessions = (req: ListExamSessionsRequest) =>
  apiAction(api => api.ExamCalendar.ListExamSessions(req))

export type ListExamSessionsRequest = InferEndpointRequest<typeof ListExamSessionsEndpoint>

export type ListExamSessionsRes = Effect.Success<ReturnType<typeof listExamSessions>>

export type ListExamSessionsError = Effect.Error<ReturnType<typeof listExamSessions>>

export const listDistrictChambers = (req: ListDistrictChambersRequest) =>
  apiAction(api => api.ExamCalendar.ListDistrictChambers(req))

export type ListDistrictChambersRequest = InferEndpointRequest<typeof ListDistrictChambersEndpoint>

export type ListDistrictChambersRes = Effect.Success<ReturnType<typeof listDistrictChambers>>

export type ListDistrictChambersError = Effect.Error<ReturnType<typeof listDistrictChambers>>
