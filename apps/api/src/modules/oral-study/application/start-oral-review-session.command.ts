import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { OralQuestionCategoryId } from '@inzpro/domain/modules/learning-content/oral-question-category'
import type { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { reviewStudySession } from '@inzpro/domain/modules/learning/study-session'
import type { OralQuestionScope } from '@inzpro/domain/modules/oral-study/oral-study-session'
import { oralExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { DateTime, Effect, Option } from 'effect'
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
import { oralReviewSettings } from '~api/modules/oral-study/domain/oral-review-session.rules.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { PreparationRepository } from '~api/modules/preparation/application/preparation.repository.js'

export const startOralReviewSession = Effect.fn('Study.startOralReviewSession')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  categoryId: Option.Option<OralQuestionCategoryId>,
  questionCount: QuestionCount,
  questionScope: OralQuestionScope,
) {
  const oralStudyReader = yield* OralStudyReader
  const oralStudyRepository = yield* OralStudyRepository
  const preparationRepository = yield* PreparationRepository

  return yield* oralStudyRepository.transaction(
    Effect.gen(function* () {
      yield* preparationRepository.lockUser(userId)
      const assignment = yield* requirePathAccess(userId, pathId, oralExamAccess)
      const { reportedIn } = yield* oralQuestionFilter(questionScope, assignment.districtChamber)

      if (Option.isSome(categoryId)) {
        const category = yield* oralStudyReader.category(
          userId,
          pathId,
          currentLearningRound(yield* oralStudyReader.learningRound(userId, pathId)),
          categoryId.value,
          Option.none(),
        )

        if (Option.isNone(category)) {
          return yield* new OralCategoryNotOnPath()
        }
      }

      const unfinished = yield* oralStudyReader.unfinishedReviewSession(userId, pathId, categoryId)

      if (Option.isSome(unfinished)) {
        return yield* new UnfinishedOralSessionExists({
          sessionId: unfinished.value.id,
          currentPosition: unfinished.value.currentPosition,
        })
      }

      const now = yield* DateTime.now
      const queue = yield* oralStudyReader.reviewQueue(userId, pathId, categoryId, now, reportedIn)
      const settings = oralReviewSettings(queue.dueCount)

      if (Option.isNone(settings) || !isAllowedQuestionCount(settings.value, questionCount)) {
        return yield* new StaleSessionScope()
      }

      const candidates = yield* oralStudyReader.reviewCandidates(
        userId,
        pathId,
        categoryId,
        now,
        questionCount,
        reportedIn,
      )

      if (candidates.length !== questionCount) {
        return yield* new StaleSessionScope()
      }

      return yield* oralStudyRepository.createSession({
        userId,
        qualificationPathId: pathId,
        kind: reviewStudySession,
        categoryId,
        goalVersion: assignment.goal.version,
        questions: candidates,
      })
    }),
  )
})
