import { logAndFailInternalServerError } from '~api/lib/internal-server-error.js'

export const failRankingRead = logAndFailInternalServerError('Could not read the ranking.')
