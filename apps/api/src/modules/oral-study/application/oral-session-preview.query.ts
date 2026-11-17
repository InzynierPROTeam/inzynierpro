import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { OralQuestionCategoryId } from '@inzpro/domain/modules/learning-content/oral-question-category'
import type { OralQuestionScope } from '@inzpro/domain/modules/oral-study/oral-study-session'
import { oralExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect, Option } from 'effect'
import {
  currentLearningRound,
  isNewLearningRound,
} from '~api/modules/learning/domain/learning-round.rules.js'
import { OralStudyReader } from '~api/modules/oral-study/application/oral-study.reader.js'
import {
  type OralQuestionFilter,
  oralQuestionFilter,
} from '~api/modules/oral-study/domain/oral-question-scope.rules.js'
import {
  type OralSessionPreview,
  oralStudySettings,
} from '~api/modules/oral-study/domain/oral-session-preview.rules.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'

export const findOralSessionPreview = Effect.fn('Study.findOralSessionPreview')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  categoryId: Option.Option<OralQuestionCategoryId>,
  fromCategoryId: Option.Option<OralQuestionCategoryId>,
  { questionScope, reportedIn }: OralQuestionFilter,
) {
  const oralStudyReader = yield* OralStudyReader
  const progress = yield* oralStudyReader.learningRound(userId, pathId)
  const round = currentLearningRound(progress)

  const found = yield* Option.match(categoryId, {
    onNone: () =>
      oralStudyReader.nextCategory(
        userId,
        pathId,
        { round, fromCategoryId, skipsStartCategory: isNewLearningRound(progress) },
        reportedIn,
      ),
    onSome: id => oralStudyReader.category(userId, pathId, round, id, reportedIn),
  })

  return Option.map(found, (category): OralSessionPreview => ({
    qualificationPathId: pathId,
    questionScope,
    category,
    settings: oralStudySettings(category.availableQuestionCount),
  }))
})

export const getOralSessionPreview = Effect.fn('Study.getOralSessionPreview')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  categoryId: Option.Option<OralQuestionCategoryId>,
  fromCategoryId: Option.Option<OralQuestionCategoryId>,
  questionScope: OralQuestionScope,
) {
  const assignment = yield* requirePathAccess(userId, pathId, oralExamAccess)
  const filter = yield* oralQuestionFilter(questionScope, assignment.districtChamber)

  return yield* findOralSessionPreview(userId, pathId, categoryId, fromCategoryId, filter)
})
