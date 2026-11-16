import { Api } from '@inzpro/api-contracts/api'
import { Effect } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import { mapCursorPage } from '~api/lib/cursor-pagination.js'
import { invalidCursor } from '~api/lib/invalid-cursor.js'
import { limitByClient, publicReadLimit } from '~api/lib/rate-limit.js'
import { ExamCalendarReader } from '~api/modules/exam-calendar/application/exam-calendar.reader.js'
import { ExamCalendarReaderLive } from '~api/modules/exam-calendar/infrastructure/exam-calendar.reader.postgres.js'

import { failExamCalendarRead } from './errors.js'
import { toExamSessionOptionDto } from './mappers.js'

export const ExamCalendarLive = HttpApiBuilder.group(Api, 'ExamCalendar', handlers =>
  handlers
    .handle('ListExamSessions', ({ query }) =>
      limitByClient(publicReadLimit).pipe(
        Effect.andThen(
          ExamCalendarReader.use(reader => reader.sessions(query.specializationId, query)),
        ),
        Effect.map(page => mapCursorPage(page, toExamSessionOptionDto)),
        Effect.catchTags({
          ExamCalendarReadError: failExamCalendarRead,
          InvalidCursor: () => invalidCursor,
        }),
      ),
    )
    .handle('ListDistrictChambers', ({ query }) =>
      limitByClient(publicReadLimit).pipe(
        Effect.andThen(
          ExamCalendarReader.use(reader => reader.districtChambers(query.generalChamberId, query)),
        ),
        Effect.catchTags({
          ExamCalendarReadError: failExamCalendarRead,
          InvalidCursor: () => invalidCursor,
        }),
      ),
    ),
)

export const ExamCalendarRequestServices = ExamCalendarReaderLive
