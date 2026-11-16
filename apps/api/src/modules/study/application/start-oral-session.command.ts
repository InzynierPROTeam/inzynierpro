import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { OralQuestionCategoryId } from '@inzpro/domain/modules/learning-content/oral-question-category'
import type { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { oralExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import type { QualificationPathId } from '@inzpro/domain/modules/qualification-paths/qualification-path'
import { Effect, Option } from 'effect'
import { requirePathAccess } from '~api/modules/preparation/application/path-access.policy.js'
import { PreparationRepository } from '~api/modules/preparation/application/preparation.repository.js'
import {
  OralCategoryNotOnPath,
  StaleSessionScope,
  UnfinishedOralSessionExists,
} from '~api/modules/study/domain/errors.js'
import { currentLearningRound } from '~api/modules/study/domain/learning-round.rules.js'
import { oralStudySettings } from '~api/modules/study/domain/oral-session-preview.rules.js'
import { isAllowedQuestionCount } from '~api/modules/study/domain/session-preview.rules.js'

import { OralStudyReader } from './oral-study.reader.js'
import { OralStudyRepository } from './oral-study.repository.js'
import { StudyRepository } from './study.repository.js'

// The account lock keeps preview validation consistent with self-assessments and assignment changes.
export const startOralSession = Effect.fn('Study.startOralSession')(function* (
  userId: UserId,
  pathId: QualificationPathId,
  categoryId: OralQuestionCategoryId,
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
      const unfinished = yield* oralStudyReader.unfinishedSession(userId, pathId, categoryId)

      if (Option.isSome(unfinished)) {
        return yield* new UnfinishedOralSessionExists({
          sessionId: unfinished.value.id,
          currentPosition: unfinished.value.currentPosition,
        })
      }

      const round = currentLearningRound(yield* oralStudyReader.learningRound(userId, pathId))
      const category = yield* oralStudyReader.category(userId, pathId, round, categoryId)

      if (Option.isNone(category)) {
        return yield* new OralCategoryNotOnPath()
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
      )

      // Each statement sees newly committed rows, so a withdrawal between the two reads could shrink the set.
      if (questions.length !== questionCount) {
        return yield* new StaleSessionScope()
      }

      return yield* oralStudyRepository.createSession({
        userId,
        qualificationPathId: pathId,
        categoryId,
        goalVersion: assignment.goal.version,
        questions,
      })
    }),
  )
})
