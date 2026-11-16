import { HttpApiEndpoint, HttpApiGroup } from 'effect/http-api'
import {
  InternalServerError,
  InvalidRequest,
  RateLimitExceeded,
} from '~api-contracts/utils/api-error.js'

import { DistrictChambersQuery, ExamSessionsQuery } from './requests.js'
import { DistrictChambersResponse, ExamSessionsResponse } from './responses.js'

export const ListExamSessionsEndpoint = HttpApiEndpoint.get('ListExamSessions', '/sessions', {
  query: ExamSessionsQuery,
  success: ExamSessionsResponse,
  error: [InternalServerError, RateLimitExceeded, InvalidRequest],
})

export const ListDistrictChambersEndpoint = HttpApiEndpoint.get(
  'ListDistrictChambers',
  '/district-chambers',
  {
    query: DistrictChambersQuery,
    success: DistrictChambersResponse,
    error: [InternalServerError, RateLimitExceeded, InvalidRequest],
  },
)

export const ExamCalendarApi = HttpApiGroup.make('ExamCalendar')
  .add(ListExamSessionsEndpoint)
  .add(ListDistrictChambersEndpoint)
  .prefix('/exam-calendar')
