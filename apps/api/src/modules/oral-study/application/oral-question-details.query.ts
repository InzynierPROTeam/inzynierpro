import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { OralQuestionId } from '@inzpro/domain/modules/learning-content/oral-question'
import { oralExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect, Option } from 'effect'
import { QuestionNotOnPath } from '~api/modules/learning/domain/errors.js'
import { OralStudyReader } from '~api/modules/oral-study/application/oral-study.reader.js'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'

export const getOralQuestionDetails = Effect.fn('Study.getOralQuestionDetails')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  questionId: OralQuestionId,
) {
  yield* requirePathAccess(userId, pathId, { part: oralExamAccess })
  const oralStudyReader = yield* OralStudyReader
  const details = yield* oralStudyReader.questionDetails(userId, pathId, questionId)

  if (Option.isNone(details)) {
    return yield* new QuestionNotOnPath()
  }

  return details.value
})
