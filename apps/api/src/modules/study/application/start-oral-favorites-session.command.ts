import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { oralExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { favoritesStudySession } from '@inzpro/domain/modules/study/study-session'
import { Effect, Option } from 'effect'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { PreparationRepository } from '~api/modules/preparation/application/preparation.repository.js'
import { StaleSessionScope, UnfinishedOralSessionExists } from '~api/modules/study/domain/errors.js'
import { oralReviewSettings } from '~api/modules/study/domain/oral-review-session.rules.js'
import { isAllowedQuestionCount } from '~api/modules/study/domain/session-preview.rules.js'

import { OralStudyReader } from './oral-study.reader.js'
import { OralStudyRepository } from './oral-study.repository.js'
import { StudyRepository } from './study.repository.js'

export const startOralFavoritesSession = Effect.fn('Study.startOralFavoritesSession')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  questionCount: QuestionCount,
) {
  const oralStudyReader = yield* OralStudyReader
  const oralStudyRepository = yield* OralStudyRepository
  const studyRepository = yield* StudyRepository
  const preparationRepository = yield* PreparationRepository

  return yield* studyRepository.transaction(
    Effect.gen(function* () {
      yield* preparationRepository.lockUser(userId)
      const assignment = yield* requirePathAccess(userId, pathId, oralExamAccess)

      const unfinished = yield* oralStudyReader.unfinishedFavoritesSession(userId, pathId)

      if (Option.isSome(unfinished)) {
        return yield* new UnfinishedOralSessionExists({
          sessionId: unfinished.value.id,
          currentPosition: unfinished.value.currentPosition,
        })
      }

      const settings = oralReviewSettings(
        yield* oralStudyReader.favoriteQuestionCount(userId, pathId),
      )

      if (Option.isNone(settings) || !isAllowedQuestionCount(settings.value, questionCount)) {
        return yield* new StaleSessionScope()
      }

      const candidates = yield* oralStudyReader.favoriteCandidates(userId, pathId, questionCount)

      if (candidates.length !== questionCount) {
        return yield* new StaleSessionScope()
      }

      return yield* oralStudyRepository.createSession({
        userId,
        qualificationPathId: pathId,
        kind: favoritesStudySession,
        categoryId: Option.none(),
        goalVersion: assignment.goal.version,
        questions: candidates,
      })
    }),
  )
})
