import { HttpApiEndpoint, HttpApiGroup } from 'effect/http-api'
import {
  InternalServerError,
  InvalidRequest,
  RateLimitExceeded,
} from '~api-contracts/utils/api-error.js'

import { ExamSessionsQuery } from './requests.js'
import { ExamSessionsResponse } from './responses.js'

export const ListExamSessionsEndpoint = HttpApiEndpoint.get('ListExamSessions', '/sessions', {
  query: ExamSessionsQuery,
  success: ExamSessionsResponse,
  error: [InternalServerError, RateLimitExceeded, InvalidRequest],
})

export const ExamCalendarApi = HttpApiGroup.make('ExamCalendar')
  .add(ListExamSessionsEndpoint)
  .prefix('/exam-calendar')
