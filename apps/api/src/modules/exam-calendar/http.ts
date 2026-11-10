import { Api } from '@inzpro/api-contracts/api'
import { InternalServerError, InvalidRequest } from '@inzpro/api-contracts/utils/api-error'
import { Effect, Layer } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import { ExamCalendarReader } from '~api/modules/exam-calendar/exam-calendar.reader.js'
import { ExamCalendarReaderLive } from '~api/modules/exam-calendar/exam-calendar.reader.postgres.js'

export const ExamCalendarLive = HttpApiBuilder.group(Api, 'ExamCalendar', handlers =>
  Effect.gen(function* () {
    const examCalendarReader = yield* ExamCalendarReader

    return handlers.handle('ListExamSessions', ({ query }) =>
      examCalendarReader.sessions(query.specializationId, query).pipe(
        Effect.catchTags({
          ExamCalendarReadError: error =>
            Effect.logError('exam_calendar_read_failed', error).pipe(
              Effect.andThen(
                Effect.fail(
                  new InternalServerError({
                    type: 'internal_server_error',
                    message: 'Could not read exam sessions.',
                  }),
                ),
              ),
            ),
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
