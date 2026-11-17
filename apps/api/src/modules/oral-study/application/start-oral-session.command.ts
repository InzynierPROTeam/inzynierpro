import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { OralQuestionCategoryId } from '@inzpro/domain/modules/learning-content/oral-question-category'
import type { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { regularStudySession } from '@inzpro/domain/modules/learning/study-session'
import type { OralQuestionScope } from '@inzpro/domain/modules/oral-study/oral-study-session'
import { oralExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect, Option } from 'effect'
import { Transaction } from '~api/lib/transaction.js'
import { StaleSessionScope } from '~api/modules/learning/domain/errors.js'
import { currentLearningRound } from '~api/modules/learning/domain/learning-round.rules.js'
import { isAllowedQuestionCount } from '~api/modules/learning/domain/session-count.rules.js'
import { OralStudyReader } from '~api/modules/oral-study/application/oral-study.reader.js'
import { OralStudyRepository } from '~api/modules/oral-study/application/oral-study.repository.js'
import {
  OralCategoryNotOnPath,
  UnfinishedOralSessionExists,
} from '~api/modules/oral-study/domain/errors.js'
import { oralQuestionFilter } from '~api/modules/oral-study/domain/oral-question-scope.rules.js'
import { oralStudySettings } from '~api/modules/oral-study/domain/oral-session-preview.rules.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { PreparationRepository } from '~api/modules/preparation/application/preparation.repository.js'

export const startOralSession = Effect.fn('Study.startOralSession')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  categoryId: OralQuestionCategoryId,
  questionCount: QuestionCount,
  questionScope: OralQuestionScope,
) {
  const oralStudyReader = yield* OralStudyReader
  const oralStudyRepository = yield* OralStudyRepository
  const transaction = yield* Transaction
  const preparationRepository = yield* PreparationRepository

  return yield* transaction.run(
    Effect.gen(function* () {
      yield* preparationRepository.lockUser(userId)
      const assignment = yield* requirePathAccess(userId, pathId, { part: oralExamAccess })
      const { reportedIn } = yield* oralQuestionFilter(questionScope, assignment.districtChamber)
      const unfinished = yield* oralStudyReader.unfinishedSession(userId, pathId, categoryId)

      if (Option.isSome(unfinished)) {
        return yield* new UnfinishedOralSessionExists({
          sessionId: unfinished.value.id,
          currentPosition: unfinished.value.currentPosition,
        })
      }

      const round = currentLearningRound(yield* oralStudyReader.learningRound(userId, pathId))

      const category = yield* oralStudyReader.category(
        userId,
        pathId,
        round,
        categoryId,
        reportedIn,
      )

      if (Option.isNone(category)) {
        const onPath =
          Option.isSome(reportedIn) &&
          Option.isSome(
            yield* oralStudyReader.category(userId, pathId, round, categoryId, Option.none()),
          )

        return yield* onPath ? new StaleSessionScope() : new OralCategoryNotOnPath()
      }

      if (
        !isAllowedQuestionCount(
          oralStudySettings(category.value.availableQuestionCount),
          questionCount,
        )
      ) {
        return yield* new StaleSessionScope()
      }

      const questions = yield* oralStudyReader.sessionCandidates(
        userId,
        pathId,
        round,
        categoryId,
        questionCount,
        reportedIn,
      )

      if (questions.length !== questionCount) {
        return yield* new StaleSessionScope()
      }

      return yield* oralStudyRepository.createSession({
        userId,
        qualificationPathId: pathId,
        categoryId: Option.some(categoryId),
        kind: regularStudySession,
        goalVersion: assignment.goal.version,
        questions,
      })
    }),
  )
})
