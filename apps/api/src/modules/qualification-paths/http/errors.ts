import { logAndFailInternalServerError } from '~api/lib/internal-server-error.js'

export const failQualificationPathsRead = logAndFailInternalServerError(
  'Could not read qualification paths.',
)

export const failQualificationPathsWrite = logAndFailInternalServerError(
  'Could not validate qualification paths.',
)
