import { logAndFailInternalServerError } from '~api/lib/internal-server-error.js'

export const failStreakRead = logAndFailInternalServerError('Could not read the streak.')

export const failStreakWrite = logAndFailInternalServerError('Could not record the streak.')
