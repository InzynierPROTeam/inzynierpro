import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { favoritesStudySession } from '@inzpro/domain/modules/learning/study-session'
import { oralExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect, Option } from 'effect'
import { Transaction } from '~api/lib/transaction.js'
import { StaleSessionScope } from '~api/modules/learning/domain/errors.js'
import { isAllowedQuestionCount } from '~api/modules/learning/domain/session-count.rules.js'
import { OralStudyReader } from '~api/modules/oral-study/application/oral-study.reader.js'
import { OralStudyRepository } from '~api/modules/oral-study/application/oral-study.repository.js'
import { UnfinishedOralSessionExists } from '~api/modules/oral-study/domain/errors.js'
import { oralReviewSettings } from '~api/modules/oral-study/domain/oral-review-session.rules.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { PreparationRepository } from '~api/modules/preparation/application/preparation.repository.js'

export const startOralFavoritesSession = Effect.fn('Study.startOralFavoritesSession')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  questionCount: QuestionCount,
) {
  const oralStudyReader = yield* OralStudyReader
  const oralStudyRepository = yield* OralStudyRepository
  const transaction = yield* Transaction
  const preparationRepository = yield* PreparationRepository

  return yield* transaction.run(
    Effect.gen(function* () {
      yield* preparationRepository.lockUser(userId)
      const assignment = yield* requirePathAccess(userId, pathId, { part: oralExamAccess })

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
