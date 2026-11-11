import { Api } from '@inzpro/api-contracts/api'
import { InvalidRequest } from '@inzpro/api-contracts/utils/api-error'
import { Effect, Layer } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import { logAndFailInternalServerError } from '~api/lib/internal-server-error.js'
import { ExamCalendarReader } from '~api/modules/exam-calendar/exam-calendar.reader.js'
import { ExamCalendarReaderLive } from '~api/modules/exam-calendar/exam-calendar.reader.postgres.js'

export const ExamCalendarLive = HttpApiBuilder.group(Api, 'ExamCalendar', handlers =>
  Effect.gen(function* () {
    const examCalendarReader = yield* ExamCalendarReader

    return handlers.handle('ListExamSessions', ({ query }) =>
      examCalendarReader.sessions(query.specializationId, query).pipe(
        Effect.catchTags({
          ExamCalendarReadError: logAndFailInternalServerError('Could not read exam sessions.'),
          InvalidCursor: () =>
            Effect.fail(
              new InvalidRequest({
                type: 'invalid_request',
                message: 'Invalid pagination cursor.',
              }),
            ),
        }),
      ),
    )
  }),
).pipe(Layer.provide(ExamCalendarReaderLive))
