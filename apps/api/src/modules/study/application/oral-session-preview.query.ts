import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { OralQuestionCategoryId } from '@inzpro/domain/modules/learning-content/oral-question-category'
import { oralExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect, Option } from 'effect'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import {
  currentLearningRound,
  isNewLearningRound,
} from '~api/modules/study/domain/learning-round.rules.js'
import {
  type OralSessionPreview,
  oralStudySettings,
} from '~api/modules/study/domain/oral-session-preview.rules.js'

import { OralStudyReader } from './oral-study.reader.js'

export const getOralSessionPreview = Effect.fn('Study.getOralSessionPreview')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  categoryId: Option.Option<OralQuestionCategoryId>,
  fromCategoryId: Option.Option<OralQuestionCategoryId>,
) {
  yield* requirePathAccess(userId, pathId, oralExamAccess)
  const oralStudyReader = yield* OralStudyReader
  const progress = yield* oralStudyReader.learningRound(userId, pathId)
  const round = currentLearningRound(progress)

  const found = yield* Option.match(categoryId, {
    onNone: () =>
      oralStudyReader.nextCategory(userId, pathId, {
        round,
        fromCategoryId,
        skipsStartCategory: isNewLearningRound(progress),
      }),
    onSome: id => oralStudyReader.category(userId, pathId, round, id),
  })

  return Option.map(found, (category): OralSessionPreview => ({
    qualificationPathId: pathId,
    category,
    settings: oralStudySettings(category.availableQuestionCount),
  }))
})
