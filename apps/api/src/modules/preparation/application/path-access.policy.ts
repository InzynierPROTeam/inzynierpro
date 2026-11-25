import type { UserId } from '@inzpro/domain/modules/identity/user'
import { type ExamPart, includesExamPart } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect, Option } from 'effect'
import { PathPermissionDenied } from '~api/modules/preparation/domain/errors.js'

import { PreparationReader } from './preparation.reader.js'

type PathAccess = {
  readonly part?: ExamPart
  readonly includeArchived?: boolean
}

export const requirePathAccess = (
  userId: UserId,
  pathId: QualificationPathId,
  { part, includeArchived = false }: PathAccess = {},
) =>
  Effect.gen(function* () {
    const preparationReader = yield* PreparationReader
    const found = yield* preparationReader.path(userId, pathId)
    const assignment = Option.getOrUndefined(found)

    if (
      assignment === undefined ||
      (assignment.archived && !includeArchived) ||
      (part !== undefined && !includesExamPart(assignment.accessScope, part))
    ) {
      return yield* new PathPermissionDenied()
    }

    return assignment
  })
