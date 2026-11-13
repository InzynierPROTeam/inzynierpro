import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { ExamPart } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect, Option } from 'effect'
import { PathPermissionDenied } from '~api/modules/preparation/errors.js'
import { PreparationReader } from '~api/modules/preparation/preparation.reader.js'

export const requirePathAccess = (userId: UserId, pathId: QualificationPathId, part?: ExamPart) =>
  Effect.gen(function* () {
    const preparationReader = yield* PreparationReader
    const found = yield* preparationReader.path(userId, pathId)
    const assignment = Option.getOrUndefined(found)

    if (
      assignment === undefined ||
      assignment.archived ||
      (part !== undefined && assignment.accessScope !== 'both' && assignment.accessScope !== part)
    ) {
      return yield* new PathPermissionDenied()
    }

    return assignment
  })
