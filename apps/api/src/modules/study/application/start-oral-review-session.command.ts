import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { OralQuestionCategoryId } from '@inzpro/domain/modules/learning-content/oral-question-category'
import type { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { oralExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { reviewStudySession } from '@inzpro/domain/modules/study/study-session'
import { DateTime, Effect, Option } from 'effect'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { PreparationRepository } from '~api/modules/preparation/application/preparation.repository.js'
import {
  StaleSessionScope,
  OralCategoryNotOnPath,
  UnfinishedOralSessionExists,
} from '~api/modules/study/domain/errors.js'
import { currentLearningRound } from '~api/modules/study/domain/learning-round.rules.js'
import { oralReviewSettings } from '~api/modules/study/domain/oral-review-session.rules.js'
import { isAllowedQuestionCount } from '~api/modules/study/domain/session-preview.rules.js'

import { OralStudyReader } from './oral-study.reader.js'
import { OralStudyRepository } from './oral-study.repository.js'
import { StudyRepository } from './study.repository.js'

export const startOralReviewSession = Effect.fn('Study.startOralReviewSession')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  categoryId: Option.Option<OralQuestionCategoryId>,
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

      if (Option.isSome(categoryId)) {
        const category = yield* oralStudyReader.category(
          userId,
          pathId,
          currentLearningRound(yield* oralStudyReader.learningRound(userId, pathId)),
          categoryId.value,
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
      const queue = yield* oralStudyReader.reviewQueue(userId, pathId, categoryId, now)
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
