import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { OralQuestionCategoryId } from '@inzpro/domain/modules/learning-content/oral-question-category'
import { oralExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { DateTime, Effect, Option } from 'effect'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { currentLearningRound } from '~api/modules/study/domain/learning-round.rules.js'
import type { OralReviewPreview } from '~api/modules/study/domain/oral-review-session.model.js'
import { oralReviewSettings } from '~api/modules/study/domain/oral-review-session.rules.js'

import { OralStudyReader } from './oral-study.reader.js'

export const getOralReviewPreview = Effect.fn('Study.getOralReviewPreview')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  categoryId: Option.Option<OralQuestionCategoryId>,
) {
  yield* requirePathAccess(userId, pathId, oralExamAccess)
  const oralStudyReader = yield* OralStudyReader
  const round = currentLearningRound(yield* oralStudyReader.learningRound(userId, pathId))

  const category = yield* Effect.transposeOption(
    Option.map(categoryId, id => oralStudyReader.category(userId, pathId, round, id)),
  )

  if (Option.isSome(category) && Option.isNone(category.value)) {
    return Option.none()
  }

  const queue = yield* oralStudyReader.reviewQueue(userId, pathId, categoryId, yield* DateTime.now)

  return Option.some<OralReviewPreview>({
    qualificationPathId: pathId,
    category: Option.flatten(category),
    queue,
    settings: oralReviewSettings(queue.dueCount),
  })
})

export const getOralReviewSession = Effect.fn('Study.getOralReviewSession')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  categoryId: Option.Option<OralQuestionCategoryId>,
) {
  yield* requirePathAccess(userId, pathId, oralExamAccess)
  const oralStudyReader = yield* OralStudyReader

  return yield* oralStudyReader.unfinishedReviewSession(userId, pathId, categoryId)
})
