import { logAndFailInternalServerError } from '~api/lib/internal-server-error.js'

export const failExamCalendarRead = logAndFailInternalServerError('Could not read exam sessions.')

export const failExamCalendarWrite = logAndFailInternalServerError(
  'Could not validate exam sessions.',
)
