import type { UserId } from '@inzpro/domain/modules/identity/user'
import { oralExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import type { OralStudySessionId } from '@inzpro/domain/modules/study/oral-study-session'
import { Effect, Option } from 'effect'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { PreparationRepository } from '~api/modules/preparation/application/preparation.repository.js'
import { StudySessionMissing } from '~api/modules/study/domain/errors.js'

import { OralStudyReader } from './oral-study.reader.js'
import { OralStudyRepository } from './oral-study.repository.js'
import { StudyRepository } from './study.repository.js'

// The account lock ensures a concurrent self-assessment either commits before the end or is refused.
export const endOralSession = Effect.fn('Study.endOralSession')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  sessionId: OralStudySessionId,
) {
  const oralStudyReader = yield* OralStudyReader
  const oralStudyRepository = yield* OralStudyRepository
  const studyRepository = yield* StudyRepository
  const preparationRepository = yield* PreparationRepository

  return yield* studyRepository.transaction(
    Effect.gen(function* () {
      yield* preparationRepository.lockUser(userId)
      yield* requirePathAccess(userId, pathId, oralExamAccess)
      const session = yield* oralStudyReader.session(userId, pathId, sessionId)

      if (Option.isNone(session)) {
        return yield* new StudySessionMissing()
      }

      if (Option.isSome(session.value.endedAt)) {
        return session.value
      }

      return yield* oralStudyRepository.endSession(sessionId)
    }),
  )
})
