import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { OralQuestionCategoryId } from '@inzpro/domain/modules/learning-content/oral-question-category'
import { oralExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import type { OralQuestionScope } from '@inzpro/domain/modules/study/oral-study-session'
import { DateTime, Effect, Option } from 'effect'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { currentLearningRound } from '~api/modules/study/domain/learning-round.rules.js'
import {
  type OralQuestionFilter,
  oralQuestionFilter,
} from '~api/modules/study/domain/oral-question-scope.rules.js'
import type { OralReviewPreview } from '~api/modules/study/domain/oral-review-session.model.js'
import { oralReviewSettings } from '~api/modules/study/domain/oral-review-session.rules.js'

import { OralStudyReader } from './oral-study.reader.js'

export const findOralReviewPreview = Effect.fn('Study.findOralReviewPreview')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  categoryId: Option.Option<OralQuestionCategoryId>,
  { questionScope, reportedIn }: OralQuestionFilter,
) {
  const oralStudyReader = yield* OralStudyReader
  const round = currentLearningRound(yield* oralStudyReader.learningRound(userId, pathId))

  const category = yield* Effect.transposeOption(
    Option.map(categoryId, id =>
      oralStudyReader.category(userId, pathId, round, id, Option.none()),
    ),
  )

  if (Option.isSome(category) && Option.isNone(category.value)) {
    return Option.none()
  }

  const queue = yield* oralStudyReader.reviewQueue(
    userId,
    pathId,
    categoryId,
    yield* DateTime.now,
    reportedIn,
  )

  return Option.some<OralReviewPreview>({
    qualificationPathId: pathId,
    questionScope,
    category: Option.flatten(category),
    queue,
    settings: oralReviewSettings(queue.dueCount),
  })
})

export const getOralReviewPreview = Effect.fn('Study.getOralReviewPreview')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  categoryId: Option.Option<OralQuestionCategoryId>,
  questionScope: OralQuestionScope,
) {
  const assignment = yield* requirePathAccess(userId, pathId, oralExamAccess)
  const filter = yield* oralQuestionFilter(questionScope, assignment.districtChamber)

  return yield* findOralReviewPreview(userId, pathId, categoryId, filter)
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
