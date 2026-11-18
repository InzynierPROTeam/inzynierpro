import { logAndFailInternalServerError } from '~api/lib/internal-server-error.js'

export const failXpRead = logAndFailInternalServerError('Could not read learning XP.')
export const failXpWrite = logAndFailInternalServerError('Could not award learning XP.')
